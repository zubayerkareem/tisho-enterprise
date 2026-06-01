-- =============================================================================
-- Tisho Enterprises — Initial Schema
-- =============================================================================
-- All monetary values stored in PENCE (integer) to avoid float drift.
-- All timestamps are timestamptz (UTC).
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron" schema extensions;

-- ─── Enums ───────────────────────────────────────────────────────────────────
create type kyc_status         as enum ('pending', 'approved', 'rejected');
create type user_role          as enum ('investor', 'admin');
create type investment_type    as enum ('comprehensive', 'compact');
create type investment_status  as enum ('active', 'completed', 'pending', 'withdrawn');
create type payout_frequency   as enum ('monthly', 'quarterly', 'annual');
create type payment_status     as enum ('completed', 'pending', 'failed');
create type payment_source     as enum ('stripe', 'manual');
create type withdrawal_status  as enum ('pending', 'under_review', 'approved', 'rejected', 'paid');
create type support_sender     as enum ('investor', 'admin');
create type support_status     as enum ('open', 'resolved');
create type payout_method_type as enum ('bank');
create type profit_mode        as enum ('automatic', 'manual');
create type kyc_doc_kind       as enum ('id_front', 'id_back', 'address', 'selfie');

-- ─── profiles ─────────────────────────────────────────────────────────────────
-- One row per auth.users entry.
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  name         text not null default '',
  phone        text,
  country      text,
  avatar_url   text,
  role         user_role not null default 'investor',
  kyc_status   kyc_status not null default 'pending',
  kyc_reason   text,             -- rejection reason
  suspended    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── investment_plans ─────────────────────────────────────────────────────────
-- Admin-configurable plan definitions.
create table public.investment_plans (
  id           uuid primary key default uuid_generate_v4(),
  type         investment_type not null unique,
  name         text not null,
  description  text,
  term_months  int not null default 24,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Seed the two plans
insert into public.investment_plans (type, name, description) values
  ('comprehensive', 'Comprehensive Policy', '25% annual return, 24-month term, principal returned at maturity'),
  ('compact',       'Compact Policy',       'Tiered monthly returns based on principal amount, 24-month term');

-- ─── plan_rate_tiers ──────────────────────────────────────────────────────────
-- Tier rows per plan. Comprehensive has a single flat-rate tier.
-- Compact has amount-banded tiers.
create table public.plan_rate_tiers (
  id              uuid primary key default uuid_generate_v4(),
  plan_id         uuid not null references public.investment_plans(id) on delete cascade,
  min_amount_pence bigint not null default 0,     -- inclusive lower bound (0 = any)
  max_amount_pence bigint,                         -- null = no upper limit
  rate_percent    numeric(5,2) not null,           -- e.g. 7.00 = 7%
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

-- Seed comprehensive flat rate
insert into public.plan_rate_tiers (plan_id, min_amount_pence, max_amount_pence, rate_percent, sort_order)
select id, 0, null, 25.00, 0 from public.investment_plans where type = 'comprehensive';

-- Seed compact tiers (amounts in pence; tiers between £50k–£5M pending client confirmation)
insert into public.plan_rate_tiers (plan_id, min_amount_pence, max_amount_pence, rate_percent, sort_order)
select id, tier.min, tier.max, tier.rate, tier.ord
from public.investment_plans, (values
  (0,          500000,    6.00, 1),   -- ≤ £5,000
  (500001,     5000000,   7.00, 2),   -- £5,001 – £50,000
  (5000001,    50000000,  8.00, 3),   -- £50,001 – £500,000 (PROVISIONAL)
  (50000001,   500000000, 9.00, 4),   -- £500,001 – £5,000,000 (PROVISIONAL)
  (500000001,  null,      10.00, 5)   -- > £5,000,000
) as tier(min, max, rate, ord)
where type = 'compact';

-- ─── investments ──────────────────────────────────────────────────────────────
create table public.investments (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  type                    investment_type not null,
  label                   text not null,
  amount_pence            bigint not null,          -- principal in pence
  currency                char(3) not null default 'GBP',
  start_date              date not null,
  end_date                date not null,
  months_total            int not null default 24,
  payout_frequency        payout_frequency not null default 'monthly',
  rate_percent            numeric(5,2) not null,
  rate_per_year_pence     bigint,                   -- null for compact
  rate_per_month_pence    bigint,                   -- null for annual
  principal_return_pence  bigint not null default 0,
  status                  investment_status not null default 'pending',
  next_payment_date       date,
  profit_mode             profit_mode not null default 'automatic',
  stripe_payment_intent_id text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index idx_investments_user_id on public.investments(user_id);
create index idx_investments_status  on public.investments(status);

-- Helper: months elapsed since start_date
create or replace function public.investment_months_elapsed(p_start_date date)
returns int language sql stable as $$
  select extract(year from age(current_date, p_start_date))::int * 12
       + extract(month from age(current_date, p_start_date))::int;
$$;

-- ─── payments ─────────────────────────────────────────────────────────────────
create table public.payments (
  id                  uuid primary key default uuid_generate_v4(),
  investment_id       uuid not null references public.investments(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  date                date not null,
  amount_pence        bigint not null,
  currency            char(3) not null default 'GBP',
  method              text not null default 'Bank Transfer',
  status              payment_status not null default 'pending',
  description         text not null,
  source              payment_source not null default 'manual',
  stripe_charge_id    text,
  created_at          timestamptz not null default now()
);

create index idx_payments_user_id       on public.payments(user_id);
create index idx_payments_investment_id on public.payments(investment_id);
create index idx_payments_date          on public.payments(date desc);

-- ─── payout_methods ──────────────────────────────────────────────────────────
create table public.payout_methods (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  type                 payout_method_type not null default 'bank',
  label                text not null,
  account_name         text not null,
  account_number_masked text not null,   -- stored masked, e.g. ****4521
  sort_code_masked     text not null,    -- stored masked, e.g. 20-**-**
  is_primary           boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- Enforce at most one primary per user
create unique index idx_payout_methods_primary
  on public.payout_methods(user_id)
  where is_primary = true;

-- ─── withdrawals ─────────────────────────────────────────────────────────────
create table public.withdrawals (
  id               uuid primary key default uuid_generate_v4(),
  investment_id    uuid not null references public.investments(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  request_date     date not null default current_date,
  amount_pence     bigint not null,
  reason           text not null,
  payout_method_id uuid references public.payout_methods(id) on delete set null,
  status           withdrawal_status not null default 'pending',
  resolved_date    date,
  admin_note       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_withdrawals_user_id    on public.withdrawals(user_id);
create index idx_withdrawals_status     on public.withdrawals(status);

-- ─── kyc_documents ───────────────────────────────────────────────────────────
create table public.kyc_documents (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  kind         kyc_doc_kind not null,
  storage_path text not null,          -- Supabase Storage object path
  status       kyc_status not null default 'pending',
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_kyc_documents_user_id on public.kyc_documents(user_id);

-- ─── support_threads ─────────────────────────────────────────────────────────
create table public.support_threads (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  subject    text not null,
  status     support_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_support_threads_user_id on public.support_threads(user_id);
create index idx_support_threads_status  on public.support_threads(status);

-- ─── support_messages ────────────────────────────────────────────────────────
create table public.support_messages (
  id             uuid primary key default uuid_generate_v4(),
  thread_id      uuid not null references public.support_threads(id) on delete cascade,
  sender         support_sender not null,
  body           text not null,
  attachment_url text,
  created_at     timestamptz not null default now()
);

create index idx_support_messages_thread_id on public.support_messages(thread_id);

-- ─── notification_prefs ──────────────────────────────────────────────────────
create table public.notification_prefs (
  user_id          uuid primary key references public.profiles(id) on delete cascade,
  payment_received boolean not null default true,
  withdrawal_update boolean not null default true,
  kyc_update       boolean not null default true,
  support_reply    boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-create notification prefs on profile creation
create or replace function public.handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notification_prefs (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.handle_new_profile();

-- ─── admin_audit_log ─────────────────────────────────────────────────────────
create table public.admin_audit_log (
  id           uuid primary key default uuid_generate_v4(),
  actor_id     uuid not null references public.profiles(id),
  action       text not null,
  target_table text,
  target_id    uuid,
  diff         jsonb,
  created_at   timestamptz not null default now()
);

create index idx_audit_log_actor_id    on public.admin_audit_log(actor_id);
create index idx_audit_log_created_at  on public.admin_audit_log(created_at desc);

-- ─── app_settings ────────────────────────────────────────────────────────────
-- Singleton row for admin-configurable settings (SMTP provider, etc.)
create table public.app_settings (
  id            int primary key default 1 check (id = 1),  -- singleton
  smtp_provider text not null default 'resend',             -- 'resend' | 'google'
  smtp_config   jsonb not null default '{}'::jsonb,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.profiles(id)
);

insert into public.app_settings (smtp_provider, smtp_config) values ('resend', '{}');

-- ─── Helper: is_admin() ──────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ─── RPC: monthly_chart_data ─────────────────────────────────────────────────
-- Aggregates completed payments by month for the chart.
create or replace function public.monthly_chart_data(
  p_user_id uuid,
  p_months  int default 12
)
returns table(month text, received numeric)
language sql stable security definer set search_path = public as $$
  select
    to_char(date_trunc('month', p.date), 'Mon YY') as month,
    sum(p.amount_pence) / 100.0                     as received
  from public.payments p
  where p.user_id = p_user_id
    and p.status  = 'completed'
    and p.date   >= (current_date - (p_months || ' months')::interval)
  group by date_trunc('month', p.date)
  order by date_trunc('month', p.date);
$$;

-- ─── updated_at trigger ──────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply to all tables with updated_at
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','investment_plans','investments','payout_methods',
    'withdrawals','support_threads','notification_prefs','app_settings'
  ] loop
    execute format(
      'create trigger trg_%s_updated_at before update on public.%s for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;
