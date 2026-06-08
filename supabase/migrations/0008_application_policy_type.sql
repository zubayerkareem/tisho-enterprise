-- Allow one application per user per policy type
alter table public.investor_applications
  add column if not exists policy_type text not null default 'capital_return'
    check (policy_type in ('capital_return', 'compact')),
  add column if not exists sort_code text;

-- Drop single-user unique constraint, replace with (user, policy) composite
alter table public.investor_applications
  drop constraint if exists investor_applications_user_id_key;

alter table public.investor_applications
  add constraint investor_applications_user_policy_key
    unique (user_id, policy_type);
