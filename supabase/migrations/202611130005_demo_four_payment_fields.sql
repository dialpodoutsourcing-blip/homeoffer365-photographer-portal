begin;

alter table public.photographer_submissions
  add column if not exists payment_method text,
  add column if not exists payment_link text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'photographer_submissions_payment_method_check'
      and conrelid = 'public.photographer_submissions'::regclass
  ) then
    alter table public.photographer_submissions
      add constraint photographer_submissions_payment_method_check
      check (payment_method is null or payment_method in ('venmo', 'zelle'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'photographer_submissions_payment_link_check'
      and conrelid = 'public.photographer_submissions'::regclass
  ) then
    alter table public.photographer_submissions
      add constraint photographer_submissions_payment_link_check
      check (
        payment_link is null
        or (
          char_length(btrim(payment_link)) between 1 and 2048
          and payment_link ~ '^https://'
        )
      );
  end if;
end
$$;

comment on column public.photographer_submissions.payment_method
  is 'Selected payment method: venmo or zelle';

comment on column public.photographer_submissions.payment_link
  is 'HTTPS payment profile or payment request link';

commit;
