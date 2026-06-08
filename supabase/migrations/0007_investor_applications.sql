-- ─── investor_applications ────────────────────────────────────────────────────
create table public.investor_applications (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,

  -- Section A – Personal
  gender           text,
  marital_status   text,
  date_of_birth    text,
  nationality      text,
  occupation       text,
  postal_address   text,
  physical_address text,
  phone            text,
  fax              text,
  website          text,

  -- Section B – Bank / payout
  account_name     text,
  account_number   text,
  bank_and_branch  text,
  payout_frequency text not null default 'monthly',

  -- Section C – Identity & next of kin
  id_details          text,
  next_of_kin         text,
  next_of_kin_contact text,
  facebook            text,
  twitter             text,
  other_social        text,

  -- Section D – Payment preference
  payment_mode text,

  -- Section E – Bio
  self_description text,

  -- Meta
  status       text not null default 'submitted'
               check (status in ('submitted', 'approved', 'rejected')),
  admin_note   text,
  agreed_at    timestamptz,
  submitted_at timestamptz default now(),
  reviewed_at  timestamptz,
  reviewed_by  uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  unique (user_id)
);

-- RLS
alter table public.investor_applications enable row level security;

create policy "app_select"
  on public.investor_applications for select
  using (auth.uid() = user_id or public.is_admin());

create policy "app_insert"
  on public.investor_applications for insert
  with check (auth.uid() = user_id);

create policy "app_update_own"
  on public.investor_applications for update
  using (auth.uid() = user_id and status = 'submitted');

create policy "app_admin_all"
  on public.investor_applications for all
  using (public.is_admin());
