begin;

create table public.photographer_submissions (
  id uuid primary key default gen_random_uuid(),
  photographer_name text not null check (char_length(btrim(photographer_name)) between 1 and 200),
  email text not null check (char_length(btrim(email)) between 3 and 320),
  phone text not null check (char_length(btrim(phone)) between 1 and 50),
  property_address text not null check (char_length(btrim(property_address)) between 1 and 500),
  drive_link text not null check (
    char_length(drive_link) between 1 and 2048
    and drive_link ~ '^https://(drive|docs)\.google\.com/'
  ),
  checklist_complete boolean not null default false,
  created_at timestamptz not null default now()
);

create index photographer_submissions_created_at
  on public.photographer_submissions (created_at desc);

alter table public.photographer_submissions enable row level security;
revoke all on public.photographer_submissions from anon, authenticated;

commit;
