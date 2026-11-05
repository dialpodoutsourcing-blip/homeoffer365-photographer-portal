begin;

-- Staff membership is managed only by the project owner in SQL Editor.
create table public.portal_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.visit_links (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index visit_links_assignment on public.visit_links(assignment_id);
create table public.visit_guest_grants (
  user_id uuid not null references auth.users(id) on delete cascade,
  link_id uuid not null references public.visit_links(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, link_id)
);
alter table public.portal_staff enable row level security;
alter table public.visit_links enable row level security;
alter table public.visit_guest_grants enable row level security;
revoke all on public.portal_staff, public.visit_links, public.visit_guest_grants from public, anon, authenticated;
grant select(id, assignment_id, expires_at, revoked_at, created_at) on public.visit_links to authenticated;

create function public.is_portal_staff()
returns boolean language sql security definer set search_path = '' as $$
  select exists (select 1 from public.portal_staff where user_id = auth.uid());
$$;

create function public.can_access_assignment(p_id uuid, p_write boolean default false)
returns boolean language plpgsql security definer set search_path = '' as $$
declare visit public.assignments;
begin
  if p_write then
    select * into visit from public.assignments where id = p_id for update;
  else
    select * into visit from public.assignments where id = p_id;
  end if;
  if visit.id is null or auth.uid() is null then return false; end if;
  if public.is_portal_staff() and visit.owner_id = auth.uid() then return true; end if;
  return exists (
    select 1 from public.visit_guest_grants g join public.visit_links l on l.id = g.link_id
    where g.user_id = auth.uid() and l.assignment_id = visit.id
      and l.revoked_at is null and l.expires_at > clock_timestamp()
  );
end;
$$;

drop policy "Read own visits" on public.assignments;
drop policy "Create own draft" on public.assignments;
create policy "Read authorized visits" on public.assignments for select to authenticated
  using ((owner_id = auth.uid() and public.is_portal_staff()) or public.can_access_assignment(id,false));
create policy "Staff create own draft" on public.assignments for insert to authenticated
  with check (public.is_portal_staff() and owner_id = auth.uid() and status = 'draft' and revision = 0 and responses = '{}'::jsonb);
create policy "Staff read own link metadata" on public.visit_links for select to authenticated
  using (public.is_portal_staff() and exists (select 1 from public.assignments a where a.id = assignment_id and a.owner_id = auth.uid()));

create function public.replace_visit_link(p_id uuid, p_token text, p_days integer default 7)
returns table(id uuid, assignment_id uuid, expires_at timestamptz, revoked_at timestamptz, created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare visit public.assignments;
begin
  select * into visit from public.assignments a where a.id = p_id for update;
  if visit.id is null or not public.is_portal_staff() or visit.owner_id is distinct from auth.uid() then raise exception 'Staff access required'; end if;
  if visit.status <> 'draft' then raise exception 'Submitted visits cannot receive a new upload link'; end if;
  if p_token is null or p_token !~ '^[a-f0-9]{64}$' or p_days is null or p_days < 1 or p_days > 30 then raise exception 'Invalid link settings'; end if;
  update public.visit_links l set revoked_at = clock_timestamp() where l.assignment_id = p_id and l.revoked_at is null;
  return query insert into public.visit_links as l (assignment_id, token_hash, expires_at)
    values (p_id, encode(sha256(convert_to(p_token,'UTF8')),'hex'), clock_timestamp() + make_interval(days => p_days))
    returning l.id, l.assignment_id, l.expires_at, l.revoked_at, l.created_at;
end;
$$;

create function public.revoke_visit_links(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare visit public.assignments;
begin
  select * into visit from public.assignments where id = p_id for update;
  if visit.id is null or not public.is_portal_staff() or visit.owner_id is distinct from auth.uid() then raise exception 'Staff access required'; end if;
  update public.visit_links set revoked_at = clock_timestamp() where assignment_id = p_id and revoked_at is null;
end;
$$;

create function public.redeem_visit_link(p_id uuid, p_token text)
returns public.assignments language plpgsql security definer set search_path = '' as $$
declare visit public.assignments; link_id uuid;
begin
  if auth.uid() is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'This visit link is invalid, expired, or revoked'; end if;
  select * into visit from public.assignments where id = p_id for update;
  select id into link_id from public.visit_links where assignment_id = p_id
    and token_hash = encode(sha256(convert_to(p_token,'UTF8')),'hex') and revoked_at is null and expires_at > clock_timestamp();
  if visit.id is null or link_id is null then raise exception 'This visit link is invalid, expired, or revoked'; end if;
  insert into public.visit_guest_grants(user_id, link_id) values (auth.uid(),link_id) on conflict do nothing;
  return visit;
end;
$$;

create or replace function public.can_access_visit_file(object_name text, for_write boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare visit public.assignments; parts text[];
begin
  parts := string_to_array(object_name,'/');
  if array_length(parts,1) <> 4 or parts[3] not in ('exterior','interior','mechanical','condition','walkthrough') then return false; end if;
  select * into visit from public.assignments where id::text = parts[2];
  if visit.id is null or parts[1] <> visit.owner_id::text then return false; end if;
  if not public.can_access_assignment(visit.id,for_write) then return false; end if;
  -- Re-read after the authorization helper takes the row lock.
  select * into visit from public.assignments where id = visit.id;
  return coalesce(not for_write or visit.status = 'draft',false);
end;
$$;

create or replace function public.save_assignment(p_id uuid, p_revision integer, p_responses jsonb, p_notes text, p_submit boolean default false)
returns public.assignments language plpgsql security definer set search_path = '' as $$
declare visit public.assignments; item record; category text; prefix text;
begin
  select * into visit from public.assignments where id = p_id for update;
  if visit.id is null or not public.can_access_assignment(p_id,true) then raise exception 'Visit not found or access denied. The link may have expired or been revoked.'; end if;
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
    prefix := visit.owner_id::text || '/' || p_id::text || '/';
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

revoke all on function public.is_portal_staff(), public.can_access_assignment(uuid,boolean), public.replace_visit_link(uuid,text,integer), public.revoke_visit_links(uuid), public.redeem_visit_link(uuid,text), public.can_access_visit_file(text,boolean), public.save_assignment(uuid,integer,jsonb,text,boolean) from public, anon;
grant execute on function public.is_portal_staff(), public.can_access_assignment(uuid,boolean), public.replace_visit_link(uuid,text,integer), public.revoke_visit_links(uuid), public.redeem_visit_link(uuid,text), public.can_access_visit_file(text,boolean), public.save_assignment(uuid,integer,jsonb,text,boolean) to authenticated;

commit;
