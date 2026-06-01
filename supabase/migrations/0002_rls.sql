-- =============================================================================
-- Tisho Enterprises — Row Level Security Policies
-- =============================================================================
-- Pattern: investors access only their own rows.
--          Admins (is_admin()) bypass restrictions.
--          Public/anon access is denied everywhere.
-- =============================================================================

-- ─── Enable RLS on every table ────────────────────────────────────────────────
alter table public.profiles         enable row level security;
alter table public.investment_plans enable row level security;
alter table public.plan_rate_tiers  enable row level security;
alter table public.investments      enable row level security;
alter table public.payments         enable row level security;
alter table public.payout_methods   enable row level security;
alter table public.withdrawals      enable row level security;
alter table public.kyc_documents    enable row level security;
alter table public.support_threads  enable row level security;
alter table public.support_messages enable row level security;
alter table public.notification_prefs enable row level security;
alter table public.admin_audit_log  enable row level security;
alter table public.app_settings     enable row level security;

-- ─── profiles ─────────────────────────────────────────────────────────────────
create policy "investor: read own profile"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "investor: update own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- investors cannot elevate own role or change kyc_status / suspended
    and role = (select role from public.profiles where id = auth.uid())
    and kyc_status = (select kyc_status from public.profiles where id = auth.uid())
    and suspended = (select suspended from public.profiles where id = auth.uid())
  );

create policy "admin: full access on profiles"
  on public.profiles for all
  using (public.is_admin());

-- ─── investment_plans + plan_rate_tiers ──────────────────────────────────────
-- Everyone authenticated can read plans (needed for Add Investment flow).
create policy "authenticated: read investment plans"
  on public.investment_plans for select
  using (auth.role() = 'authenticated');

create policy "admin: manage investment plans"
  on public.investment_plans for all
  using (public.is_admin());

create policy "authenticated: read plan rate tiers"
  on public.plan_rate_tiers for select
  using (auth.role() = 'authenticated');

create policy "admin: manage plan rate tiers"
  on public.plan_rate_tiers for all
  using (public.is_admin());

-- ─── investments ─────────────────────────────────────────────────────────────
create policy "investor: read own investments"
  on public.investments for select
  using (user_id = auth.uid() or public.is_admin());

create policy "investor: insert own investment"
  on public.investments for insert
  with check (user_id = auth.uid());

-- Investors cannot mutate investment status/dates directly (admin-only mutation).
create policy "admin: full access on investments"
  on public.investments for all
  using (public.is_admin());

-- ─── payments ────────────────────────────────────────────────────────────────
create policy "investor: read own payments"
  on public.payments for select
  using (user_id = auth.uid() or public.is_admin());

-- Payments are inserted by Edge Functions (service role) and admins only.
create policy "admin: full access on payments"
  on public.payments for all
  using (public.is_admin());

-- ─── payout_methods ──────────────────────────────────────────────────────────
create policy "investor: read own payout methods"
  on public.payout_methods for select
  using (user_id = auth.uid() or public.is_admin());

create policy "investor: insert own payout method"
  on public.payout_methods for insert
  with check (user_id = auth.uid());

create policy "investor: update own payout method"
  on public.payout_methods for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "investor: delete own payout method"
  on public.payout_methods for delete
  using (user_id = auth.uid());

create policy "admin: full access on payout methods"
  on public.payout_methods for all
  using (public.is_admin());

-- ─── withdrawals ─────────────────────────────────────────────────────────────
create policy "investor: read own withdrawals"
  on public.withdrawals for select
  using (user_id = auth.uid() or public.is_admin());

create policy "investor: insert own withdrawal"
  on public.withdrawals for insert
  with check (
    user_id = auth.uid()
    -- investors can only create pending withdrawals
    and status = 'pending'
  );

-- Investors cannot change status, admin notes, or resolved_date.
create policy "admin: full access on withdrawals"
  on public.withdrawals for all
  using (public.is_admin());

-- ─── kyc_documents ───────────────────────────────────────────────────────────
create policy "investor: read own kyc documents"
  on public.kyc_documents for select
  using (user_id = auth.uid() or public.is_admin());

create policy "investor: upload kyc document"
  on public.kyc_documents for insert
  with check (
    user_id = auth.uid()
    and status = 'pending'
  );

create policy "admin: full access on kyc documents"
  on public.kyc_documents for all
  using (public.is_admin());

-- ─── support_threads ─────────────────────────────────────────────────────────
create policy "investor: read own threads"
  on public.support_threads for select
  using (user_id = auth.uid() or public.is_admin());

create policy "investor: create thread"
  on public.support_threads for insert
  with check (user_id = auth.uid() and status = 'open');

create policy "admin: full access on support threads"
  on public.support_threads for all
  using (public.is_admin());

-- ─── support_messages ────────────────────────────────────────────────────────
create policy "investor: read messages in own threads"
  on public.support_messages for select
  using (
    exists (
      select 1 from public.support_threads t
      where t.id = thread_id and (t.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "investor: send message in own thread"
  on public.support_messages for insert
  with check (
    sender = 'investor'
    and exists (
      select 1 from public.support_threads t
      where t.id = thread_id and t.user_id = auth.uid() and t.status = 'open'
    )
  );

create policy "admin: full access on support messages"
  on public.support_messages for all
  using (public.is_admin());

-- ─── notification_prefs ──────────────────────────────────────────────────────
create policy "investor: read own notification prefs"
  on public.notification_prefs for select
  using (user_id = auth.uid() or public.is_admin());

create policy "investor: update own notification prefs"
  on public.notification_prefs for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admin: full access on notification prefs"
  on public.notification_prefs for all
  using (public.is_admin());

-- ─── admin_audit_log ─────────────────────────────────────────────────────────
-- Admins can read; inserts are done by Edge Functions (service role).
create policy "admin: read audit log"
  on public.admin_audit_log for select
  using (public.is_admin());

-- ─── app_settings ────────────────────────────────────────────────────────────
create policy "admin: read app settings"
  on public.app_settings for select
  using (public.is_admin());

create policy "admin: update app settings"
  on public.app_settings for update
  using (public.is_admin());

-- ─── Storage bucket: kyc-documents ───────────────────────────────────────────
-- Create via Supabase dashboard or:
-- insert into storage.buckets (id, name, public) values ('kyc-documents', 'kyc-documents', false);
--
-- Then apply storage RLS (run in Supabase dashboard SQL editor):
-- create policy "investor: upload own kyc file"
--   on storage.objects for insert
--   with check (bucket_id = 'kyc-documents' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "investor/admin: read kyc file"
--   on storage.objects for select
--   using (bucket_id = 'kyc-documents' and (auth.uid()::text = (storage.foldername(name))[1] or public.is_admin()));
