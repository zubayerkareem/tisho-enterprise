-- Expand payout_method_type enum with Cash, Western Union, MoneyGram
alter type payout_method_type add value if not exists 'cash';
alter type payout_method_type add value if not exists 'western_union';
alter type payout_method_type add value if not exists 'moneygram';

-- Make bank-specific columns nullable (not required for non-bank methods)
alter table public.payout_methods
  alter column account_number_masked set default '',
  alter column sort_code_masked      set default '';
