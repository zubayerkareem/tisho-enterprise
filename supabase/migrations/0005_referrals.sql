-- =============================================================================
-- Referral system
-- =============================================================================
-- Each user gets a unique 8-char referral code derived from their UUID.
-- When a referred user signs up, the referrer earns £10 (1000 pence).
-- =============================================================================

-- ─── Add referral columns to profiles ────────────────────────────────────────
alter table public.profiles
  add column if not exists referral_code         text unique,
  add column if not exists referred_by           uuid references public.profiles(id) on delete set null,
  add column if not exists referral_balance_pence bigint not null default 0;

-- Backfill referral codes for any existing profiles
update public.profiles
set referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
where referral_code is null;

-- Now enforce not-null with a sensible default for future rows
alter table public.profiles
  alter column referral_code set not null;

-- ─── referrals table ─────────────────────────────────────────────────────────
create table if not exists public.referrals (
  id          uuid primary key default uuid_generate_v4(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null unique references public.profiles(id) on delete cascade,
  bonus_pence bigint not null default 1000,
  created_at  timestamptz not null default now()
);

create index if not exists idx_referrals_referrer on public.referrals(referrer_id);

-- ─── RLS for referrals ───────────────────────────────────────────────────────
alter table public.referrals enable row level security;

create policy "investor: read own referrals"
  on public.referrals for select
  using (referrer_id = auth.uid() or public.is_admin());

create policy "admin: full access on referrals"
  on public.referrals for all
  using (public.is_admin());

-- ─── Update handle_new_user trigger ──────────────────────────────────────────
-- Replaces the trigger from 0003 — adds referral_code generation and
-- automatic bonus credit when a referred user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_my_code     text;
  v_ref_code    text;
  v_referrer_id uuid;
begin
  -- Derive a unique 8-char code from the new user's own UUID
  v_my_code := upper(substr(replace(new.id::text, '-', ''), 1, 8));

  insert into public.profiles (id, email, name, phone, whatsapp, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'whatsapp_number',
    v_my_code
  );

  -- Credit referrer if a valid referral code was provided at signup
  v_ref_code := upper(trim(coalesce(new.raw_user_meta_data->>'referral_code', '')));

  if v_ref_code <> '' then
    select id into v_referrer_id
    from public.profiles
    where referral_code = v_ref_code
    limit 1;

    if v_referrer_id is not null then
      -- Add £10 bonus to referrer's balance
      update public.profiles
      set referral_balance_pence = referral_balance_pence + 1000,
          updated_at = now()
      where id = v_referrer_id;

      -- Record who referred this user
      update public.profiles
      set referred_by = v_referrer_id,
          updated_at  = now()
      where id = new.id;

      -- Log the referral event
      insert into public.referrals (referrer_id, referred_id, bonus_pence)
      values (v_referrer_id, new.id, 1000);
    end if;
  end if;

  return new;
end;
$$;
