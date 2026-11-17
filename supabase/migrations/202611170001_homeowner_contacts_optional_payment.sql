begin;

alter table public.photographers
  alter column payment_method drop not null,
  alter column payment_url drop not null;

comment on column public.photographers.payment_method is
  'Legacy optional payment data; new homeowner photo submissions do not collect it.';
comment on column public.photographers.payment_url is
  'Legacy optional payment data; new homeowner photo submissions do not collect it.';

commit;
