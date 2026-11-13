begin;

create table if not exists public.photographers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text not null,
  payment_method text not null,
  payment_url text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists photographers_normalized_email
  on public.photographers (lower(btrim(email)));

create table if not exists public.photographer_property_photos (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers(id) on update cascade on delete cascade,
  property_address text not null,
  photo text not null,
  photo_name text not null,
  description text not null default '',
  photo_category text not null check (photo_category in ('exterior', 'interior', 'mechanical', 'condition', 'other')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.photographer_upload_sessions (
  id uuid primary key default gen_random_uuid(),
  photographer_id uuid not null references public.photographers(id) on update cascade on delete cascade,
  property_address text not null,
  idempotency_key uuid not null unique,
  status text not null default 'prepared' check (status in ('prepared', 'finalized', 'failed', 'expired')),
  -- Server-owned [{clientPhotoId, objectPath}]; never accept paths from prepare clients.
  expected_paths jsonb not null check (jsonb_typeof(expected_paths) = 'array'),
  not_applicable jsonb not null default '[]'::jsonb check (jsonb_typeof(not_applicable) = 'array'),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz,
  -- Preserve complete metadata to distinguish an identical retry from a changed request.
  finalized_photos jsonb
);

-- Existing rows have no classification or session. Leave those rows intact;
-- the new-row constraint and RPC require these values on every finalized photo.
alter table public.photographer_property_photos
  add column if not exists photo_category text,
  add column if not exists photo_type text,
  add column if not exists condition_status text,
  add column if not exists submission_session_id uuid references public.photographer_upload_sessions(id),
  add column if not exists client_photo_id text;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.photographer_property_photos'::regclass and conname = 'photographer_photos_classification') then
    alter table public.photographer_property_photos add constraint photographer_photos_classification check (
      (photo_type is null or (
        (photo_category = 'exterior' and photo_type in ('front','rear','sides','roof','yard','driveway','outbuildings','damage','other')) or
        (photo_category = 'interior' and photo_type in ('living_room','kitchen','hallway_room_layout','bedroom','bathroom','basement','attic','garage','under_sink','damage','other')) or
        (photo_category = 'mechanical' and photo_type in ('hvac','water_heater','electrical_panel','plumbing','other')) or
        (photo_category = 'condition' and photo_type in ('general_condition','damage','repair_needed','other'))
      )) and
      (condition_status is null or condition_status in ('good_condition','damage')) and
      (submission_session_id is null or (
        photo_category is not null and photo_type is not null and condition_status is not null and
        client_photo_id is not null and length(btrim(client_photo_id)) > 0
      ))
    );
  end if;
  if not exists (select 1 from pg_constraint where conrelid = 'public.photographer_property_photos'::regclass and conname = 'photographer_photos_session_client_unique') then
    alter table public.photographer_property_photos add constraint photographer_photos_session_client_unique
      unique (submission_session_id, client_photo_id);
  end if;
end $$;

create index if not exists photographer_photos_photographer on public.photographer_property_photos (photographer_id);
create index if not exists photographer_photos_category on public.photographer_property_photos (photo_category);
create index if not exists photographer_photos_address on public.photographer_property_photos (property_address);
create index if not exists photographer_upload_sessions_photographer on public.photographer_upload_sessions (photographer_id);

alter table public.photographers enable row level security;
alter table public.photographer_property_photos enable row level security;
alter table public.photographer_upload_sessions enable row level security;
revoke all on public.photographers, public.photographer_property_photos, public.photographer_upload_sessions from public, anon, authenticated;
grant all on public.photographers, public.photographer_property_photos, public.photographer_upload_sessions to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photographer-photos', 'photographer-photos', false, 10485760, array['image/jpeg', 'image/webp'])
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function public.finalize_photographer_upload_session(
  p_session_id uuid,
  p_idempotency_key uuid,
  p_photos jsonb,
  p_not_applicable jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  upload_session public.photographer_upload_sessions%rowtype;
  item jsonb;
  required_field text;
  photo_count integer;
begin
  select * into upload_session from public.photographer_upload_sessions
    where id = p_session_id and idempotency_key = p_idempotency_key for update;
  if not found then
    raise exception 'Invalid upload session';
  end if;

  if upload_session.status = 'finalized' then
    if upload_session.finalized_photos is distinct from p_photos or upload_session.not_applicable is distinct from p_not_applicable then
      raise exception 'Finalize retry does not match the original request';
    end if;
    return jsonb_build_object('submissionId', upload_session.id, 'photographerId', upload_session.photographer_id,
      'photoCount', jsonb_array_length(upload_session.finalized_photos));
  end if;
  if upload_session.status <> 'prepared' then
    raise exception 'Invalid upload session state';
  end if;
  if upload_session.expires_at <= clock_timestamp() then
    raise exception 'Upload session expired';
  end if;
  if jsonb_typeof(p_photos) is distinct from 'array' or jsonb_typeof(p_not_applicable) is distinct from 'array' then
    raise exception 'Invalid photo manifest';
  end if;
  photo_count := jsonb_array_length(p_photos);
  if photo_count < 10 or photo_count > 100 or photo_count <> jsonb_array_length(upload_session.expected_paths) then
    raise exception 'Invalid photo count';
  end if;

  for item in select value from jsonb_array_elements(p_photos) loop
    if jsonb_typeof(item) is distinct from 'object' then
      raise exception 'Invalid photo metadata';
    end if;
    foreach required_field in array array['clientPhotoId','objectPath','photoName','category','photoType','conditionStatus','description','capturedAt','mimeType'] loop
      if jsonb_typeof(item -> required_field) is distinct from 'string' then
        raise exception 'Invalid photo metadata';
      end if;
    end loop;
    if length(btrim(item ->> 'clientPhotoId')) = 0 or length(btrim(item ->> 'photoName')) not between 1 and 255
      or length(item ->> 'description') > 5000
      or item ->> 'mimeType' not in ('image/jpeg','image/webp') then
      raise exception 'Invalid photo metadata';
    end if;
    foreach required_field in array array['width','height','byteSize'] loop
      if jsonb_typeof(item -> required_field) is distinct from 'number'
        or (item ->> required_field)::numeric <= 0
        or (item ->> required_field)::numeric <> trunc((item ->> required_field)::numeric) then
        raise exception 'Invalid photo dimensions or size';
      end if;
    end loop;
    if (item ->> 'byteSize')::numeric > 10485760 then
      raise exception 'Photo size limit exceeded';
    end if;
    if item ->> 'capturedAt' !~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$' then
      raise exception 'Invalid capture timestamp';
    end if;
    perform (item ->> 'capturedAt')::timestamptz;
    if not exists (select 1 from jsonb_array_elements(upload_session.expected_paths) expected
      where expected ->> 'clientPhotoId' = item ->> 'clientPhotoId' and expected ->> 'objectPath' = item ->> 'objectPath') then
      raise exception 'Photo path does not match upload session';
    end if;
  end loop;

  if (select count(distinct value ->> 'clientPhotoId') from jsonb_array_elements(p_photos)) <> photo_count
    or (select count(distinct value ->> 'objectPath') from jsonb_array_elements(p_photos)) <> photo_count then
    raise exception 'Duplicate photo identifier or path';
  end if;
  if (select sum((value ->> 'byteSize')::numeric) from jsonb_array_elements(p_photos)) > 524288000 then
    raise exception 'Submission size limit exceeded';
  end if;
  if (select count(*) from jsonb_array_elements(p_photos) where value ->> 'category' = 'exterior') < 4
    or (select count(*) from jsonb_array_elements(p_photos) where value ->> 'category' = 'interior') < 4
    or (select count(*) from jsonb_array_elements(p_photos) where value ->> 'category' = 'mechanical') < 1
    or (select count(*) from jsonb_array_elements(p_photos) where value ->> 'category' = 'condition') < 1 then
    raise exception 'Insufficient category counts';
  end if;

  for item in select value from jsonb_array_elements(p_not_applicable) loop
    if jsonb_typeof(item) is distinct from 'object' or not coalesce((
      (item ->> 'category' = 'exterior' and item ->> 'photoType' in ('roof','outbuildings')) or
      (item ->> 'category' = 'interior' and item ->> 'photoType' in ('basement','attic','garage'))
    ), false) then
      raise exception 'Invalid N/A selection';
    end if;
  end loop;
  if (select count(distinct (value ->> 'category', value ->> 'photoType')) from jsonb_array_elements(p_not_applicable)) <> jsonb_array_length(p_not_applicable) then
    raise exception 'Duplicate N/A selection';
  end if;

  insert into public.photographer_property_photos
    (photographer_id,property_address,photo,photo_name,description,photo_category,photo_type,condition_status,submission_session_id,client_photo_id)
  select upload_session.photographer_id, upload_session.property_address, value ->> 'objectPath', value ->> 'photoName',
    value ->> 'description', value ->> 'category', value ->> 'photoType', value ->> 'conditionStatus', upload_session.id, value ->> 'clientPhotoId'
  from jsonb_array_elements(p_photos);

  update public.photographer_upload_sessions
    set status = 'finalized', not_applicable = p_not_applicable, finalized_photos = p_photos, finalized_at = clock_timestamp()
    where id = upload_session.id;

  return jsonb_build_object('submissionId', upload_session.id, 'photographerId', upload_session.photographer_id, 'photoCount', photo_count);
end;
$$;

revoke all on function public.finalize_photographer_upload_session(uuid, uuid, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.finalize_photographer_upload_session(uuid, uuid, jsonb, jsonb) to service_role;

commit;
