-- Add payment_method column to investments
-- Tracks whether the investor paid via bank transfer or Stripe.

alter table public.investments
  add column if not exists payment_method text not null default 'bank'
    check (payment_method in ('bank', 'stripe'));
