-- =============================================================================
-- Tisho Enterprises — Development Seed
-- =============================================================================
-- Creates a demo investor (alex.pemberton@email.com / Password1!) seeded
-- with the existing mock data so the dashboard renders immediately.
-- Run AFTER migrations: npx supabase db reset
-- =============================================================================

-- ─── Demo user ───────────────────────────────────────────────────────────────
-- Note: Supabase Auth user is created via the API / dashboard in a real setup.
-- In local dev, use the Inbucket email UI (http://localhost:54324) to confirm.
-- The profile row is auto-created by the handle_new_user trigger.
-- After creating the auth user, update the profile with the seeded data below.

-- Replace <USER_UUID> with the actual UUID from auth.users after signup.
-- You can run: select id from auth.users where email = 'alex.pemberton@email.com';

do $$
declare
  v_user_id uuid;
  v_inv_001 uuid;
  v_inv_002 uuid;
  v_inv_003 uuid;
  v_pm_001  uuid;
  v_pm_002  uuid;
  v_thread_001 uuid;
  v_thread_002 uuid;
begin
  -- Get the demo user (must be created first via Supabase Auth)
  select id into v_user_id from auth.users where email = 'alex.pemberton@email.com' limit 1;

  if v_user_id is null then
    raise notice 'Demo user not found — create alex.pemberton@email.com in Auth first, then re-run seed.';
    return;
  end if;

  -- Update profile with full details
  update public.profiles set
    name       = 'Alexandra Pemberton',
    phone      = '+44 7700 900123',
    country    = 'United Kingdom',
    kyc_status = 'approved',
    updated_at = now()
  where id = v_user_id;

  -- ─── Investments ─────────────────────────────────────────────────────────
  insert into public.investments (
    id, user_id, type, label, amount_pence, currency,
    start_date, end_date, months_total, payout_frequency,
    rate_percent, rate_per_year_pence, rate_per_month_pence,
    principal_return_pence, status, next_payment_date
  ) values
    (
      uuid_generate_v4(), v_user_id, 'comprehensive', 'Comprehensive Policy',
      2500000, 'GBP', '2024-03-01', '2026-03-01', 24, 'monthly',
      25.00, 625000, 52083, 2500000, 'active', '2025-07-01'
    ),
    (
      uuid_generate_v4(), v_user_id, 'compact', 'Compact Policy',
      1000000, 'GBP', '2024-06-01', '2026-06-01', 24, 'monthly',
      7.00, null, 70000, 0, 'active', '2025-07-01'
    ),
    (
      uuid_generate_v4(), v_user_id, 'comprehensive', 'Comprehensive Policy',
      500000, 'GBP', '2022-01-01', '2024-01-01', 24, 'annual',
      25.00, 125000, null, 500000, 'completed', null
    )
  returning id into v_inv_001;

  -- Re-fetch all three IDs
  select id into v_inv_001 from public.investments
    where user_id = v_user_id and type = 'comprehensive' and status = 'active' limit 1;
  select id into v_inv_002 from public.investments
    where user_id = v_user_id and type = 'compact' limit 1;
  select id into v_inv_003 from public.investments
    where user_id = v_user_id and status = 'completed' limit 1;

  -- ─── Payments ────────────────────────────────────────────────────────────
  insert into public.payments (investment_id, user_id, date, amount_pence, method, status, description, source) values
    (v_inv_001, v_user_id, '2025-06-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2025-06-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2025-05-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2025-05-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2025-04-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2025-04-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2025-03-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2025-03-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2025-02-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2025-02-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2025-01-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2025-01-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_002, v_user_id, '2024-12-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2024-12-01', 52083,  'Bank Transfer', 'completed', 'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_002, v_user_id, '2024-11-01', 70000,  'Bank Transfer', 'completed', 'Monthly return — Compact Policy', 'manual'),
    (v_inv_001, v_user_id, '2024-11-01', 52083,  'Bank Transfer', 'pending',   'Monthly return — Comprehensive Policy', 'manual'),
    (v_inv_003, v_user_id, '2024-01-01', 250000, 'Bank Transfer', 'completed', 'Annual return (Year 2) — Comprehensive Policy', 'manual'),
    (v_inv_003, v_user_id, '2024-01-15', 500000, 'Bank Transfer', 'completed', 'Principal return — Comprehensive Policy', 'manual');

  -- ─── Payout Methods ──────────────────────────────────────────────────────
  insert into public.payout_methods (id, user_id, type, label, account_name, account_number_masked, sort_code_masked, is_primary)
  values
    (uuid_generate_v4(), v_user_id, 'bank', 'Barclays Current Account', 'Alexandra Pemberton', '****4521', '20-**-**', true),
    (uuid_generate_v4(), v_user_id, 'bank', 'HSBC Savings Account',     'Alexandra Pemberton', '****8834', '40-**-**', false);

  select id into v_pm_001 from public.payout_methods where user_id = v_user_id and is_primary = true;

  -- ─── Withdrawals ─────────────────────────────────────────────────────────
  insert into public.withdrawals (investment_id, user_id, request_date, amount_pence, reason, payout_method_id, status, resolved_date, admin_note)
  values
    (v_inv_001, v_user_id, '2025-05-20', 200000, 'Emergency funds needed for home renovation.',
     v_pm_001, 'approved', '2025-05-23', 'Approved. Transfer initiated.'),
    (v_inv_002, v_user_id, '2025-06-10', 150000, 'Partial early withdrawal to cover medical expenses.',
     v_pm_001, 'pending', null, null);

  -- ─── Support Threads ─────────────────────────────────────────────────────
  insert into public.support_threads (id, user_id, subject, status, created_at)
  values
    (uuid_generate_v4(), v_user_id, 'Question about Compact Policy payout timing', 'resolved', '2025-04-12 10:00:00+00'),
    (uuid_generate_v4(), v_user_id, 'Unable to update bank account details',        'open',     '2025-06-14 09:00:00+00');

  select id into v_thread_001 from public.support_threads
    where user_id = v_user_id and status = 'resolved' limit 1;
  select id into v_thread_002 from public.support_threads
    where user_id = v_user_id and status = 'open' limit 1;

  insert into public.support_messages (thread_id, sender, body, created_at) values
    (v_thread_001, 'investor', 'Hi, I wanted to confirm — does the monthly payout for the Compact Policy arrive on the 1st of each month, or the anniversary of my investment date?', '2025-04-12 10:23:00+00'),
    (v_thread_001, 'admin',    'Hello Alexandra, great question! Payouts are processed on the 1st of each calendar month. Your June 1st payment will be scheduled as normal. Let us know if you have any other questions.', '2025-04-12 14:05:00+00'),
    (v_thread_001, 'investor', 'Perfect, thank you for the quick response!', '2025-04-12 14:30:00+00'),
    (v_thread_002, 'investor', 'I''m trying to add a new bank account for payouts but the form keeps showing an error after I click Save. I''ve tried on Chrome and Safari. Please advise.', '2025-06-14 09:10:00+00');

  raise notice 'Seed complete for user %', v_user_id;
end;
$$;
