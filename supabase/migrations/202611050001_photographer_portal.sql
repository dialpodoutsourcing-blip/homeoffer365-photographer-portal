begin;

create table public.checklist_template_items (
  version integer not null,
  item_id text not null,
  label text not null,
  allow_unavailable boolean not null default true,
  primary key (version, item_id)
);
insert into public.checklist_template_items (version, item_id, label, allow_unavailable) values
  (1,'0-0','Front, rear, and both sides photographed',true),
  (1,'0-1','Roof, yard, driveway, and outbuildings documented',true),
  (1,'0-2','Exterior damage photographed',true),
  (1,'1-0','Every accessible room photographed',true),
  (1,'1-1','Kitchen and bathrooms documented',true),
  (1,'1-2','Basement, attic, and garage photographed where accessible',true),
  (1,'1-3','Interior damage documented',true),
  (1,'2-0','HVAC system photographed',true),
  (1,'2-1','Water heater photographed',true),
  (1,'2-2','Electrical panel photographed where safely accessible',true),
  (1,'2-3','Visible plumbing and mechanical issues documented',true),
  (1,'3-0','Full walkthrough recorded',true),
  (1,'3-1','All accessible rooms included',true),
  (1,'3-2','Major condition issues shown',true),
  (1,'4-0','Photos are clear and properly lit',false),
  (1,'4-1','Property address confirmed',false),
  (1,'4-2','All required files uploaded',false),
  (1,'4-3','Missing or inaccessible areas reported',false),
  (1,'4-4','Assignment ready for submission',false);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  address text not null check (char_length(btrim(address)) between 8 and 500),
  status text not null default 'draft' check (status in ('draft','submitted')),
  template_version integer not null default 1 check (template_version = 1),
  responses jsonb not null default '{}'::jsonb check (jsonb_typeof(responses) = 'object'),
  notes text not null default '' check (char_length(notes) <= 5000),
  revision integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_at timestamptz,
  check ((status = 'draft' and submitted_at is null) or (status = 'submitted' and submitted_at is not null))
);
create index assignments_owner_created on public.assignments(owner_id, created_at desc);
alter table public.assignments enable row level security;
alter table public.checklist_template_items enable row level security;
revoke all on public.assignments, public.checklist_template_items from anon, authenticated;
grant select on public.assignments, public.checklist_template_items to authenticated;
grant insert(address) on public.assignments to authenticated;
create policy "Read own visits" on public.assignments for select to authenticated using (owner_id = (select auth.uid()));
create policy "Create own draft" on public.assignments for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'draft' and revision = 0 and responses = '{}'::jsonb);
create policy "Read checklist templates" on public.checklist_template_items for select to authenticated using (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('property-media','property-media',false,52428800,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime','video/webm']);

-- A visit lock serializes uploads/deletes with submission. Submitted records and
-- their files cannot be changed by photographers, including from another tab.
create function public.can_access_visit_file(object_name text, for_write boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare visit public.assignments; parts text[];
begin
  parts := string_to_array(object_name,'/');
  if array_length(parts,1) <> 4 or parts[1] <> auth.uid()::text
    or parts[3] not in ('exterior','interior','mechanical','condition','walkthrough') then return false; end if;
  if for_write then
    select * into visit from public.assignments where id::text = parts[2] and owner_id = auth.uid() for update;
  else
    select * into visit from public.assignments where id::text = parts[2] and owner_id = auth.uid();
  end if;
  return coalesce(visit.id is not null and (not for_write or visit.status = 'draft'),false);
end;
$$;
revoke all on function public.can_access_visit_file(text,boolean) from public, anon;
grant execute on function public.can_access_visit_file(text,boolean) to authenticated;
create policy "Read own private media" on storage.objects for select to authenticated
  using (bucket_id = 'property-media' and public.can_access_visit_file(name,false));
create policy "Upload to own draft" on storage.objects for insert to authenticated
  with check (bucket_id = 'property-media' and public.can_access_visit_file(name,true)
    and coalesce((metadata->>'size')::bigint,0) between 1 and 52428800
    and ((split_part(name,'/',3) = 'walkthrough' and metadata->>'mimetype' in ('video/mp4','video/quicktime','video/webm'))
      or (split_part(name,'/',3) <> 'walkthrough' and metadata->>'mimetype' in ('image/jpeg','image/png','image/webp'))));
create policy "Remove own draft media" on storage.objects for delete to authenticated
  using (bucket_id = 'property-media' and public.can_access_visit_file(name,true));

create function public.save_assignment(p_id uuid, p_revision integer, p_responses jsonb, p_notes text, p_submit boolean default false)
returns public.assignments language plpgsql security definer set search_path = '' as $$
declare visit public.assignments; item record; category text; prefix text;
begin
  select * into visit from public.assignments where id = p_id and owner_id = auth.uid() for update;
  if visit.id is null then raise exception 'Visit not found or access denied'; end if;
  if visit.status <> 'draft' then raise exception 'Submitted visits are read-only'; end if;
  if p_revision is null or visit.revision <> p_revision then raise exception 'This visit changed in another tab. Reload it before saving.'; end if;
  if p_notes is null or char_length(p_notes) > 5000 or p_responses is null or jsonb_typeof(p_responses) <> 'object' then raise exception 'Invalid checklist or notes'; end if;
  if exists (select 1 from jsonb_each_text(p_responses) r where r.value is null or r.value not in ('done','unavailable')
    or not exists (select 1 from public.checklist_template_items t where t.version = visit.template_version and t.item_id = r.key and (r.value <> 'unavailable' or t.allow_unavailable))) then
    raise exception 'Checklist contains an unknown item or invalid response';
  end if;
  if p_submit then
    for item in select * from public.checklist_template_items where version = visit.template_version loop
      if not (p_responses ? item.item_id) then raise exception 'Review every checklist item before submitting'; end if;
    end loop;
    if exists (select 1 from jsonb_each_text(p_responses) where value = 'unavailable') and char_length(btrim(p_notes)) < 10 then
      raise exception 'Explain unavailable or not applicable items in the visit notes (at least 10 characters)';
    end if;
    prefix := auth.uid()::text || '/' || p_id::text || '/';
    if not exists (select 1 from storage.objects where bucket_id = 'property-media' and starts_with(name,prefix) and metadata->>'mimetype' like 'image/%') then
      raise exception 'Upload at least one property photo';
    end if;
    foreach category in array array['exterior','interior','mechanical','walkthrough'] loop
      if not exists (select 1 from storage.objects where bucket_id = 'property-media' and starts_with(name,prefix || category || '/'))
        and exists (select 1 from public.checklist_template_items t where t.version = visit.template_version
          and split_part(t.item_id,'-',1) = case category when 'exterior' then '0' when 'interior' then '1' when 'mechanical' then '2' else '3' end
          and (p_responses->>t.item_id) is distinct from 'unavailable') then
        raise exception 'Upload files for %, or mark that entire group unavailable with an explanation', category;
      end if;
    end loop;
  end if;
  update public.assignments set responses = p_responses, notes = p_notes, revision = revision + 1, updated_at = now(),
    status = case when p_submit then 'submitted' else 'draft' end, submitted_at = case when p_submit then now() else null end
    where id = p_id returning * into visit;
  return visit;
end;
$$;
revoke all on function public.save_assignment(uuid,integer,jsonb,text,boolean) from public, anon;
grant execute on function public.save_assignment(uuid,integer,jsonb,text,boolean) to authenticated;

commit;
