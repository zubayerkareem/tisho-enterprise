-- Allow referral balance withdrawals where investment_id is not applicable
alter table public.withdrawals
  alter column investment_id drop not null;

-- Track what the withdrawal is drawn from
alter table public.withdrawals
  add column if not exists source text not null default 'investment'
    check (source in ('investment', 'referral_balance'));
