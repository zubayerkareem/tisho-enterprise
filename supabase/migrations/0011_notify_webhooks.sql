-- Automatically call notify-investor edge function on relevant table changes.
-- Deployed with --no-verify-jwt so no auth header is needed here.

CREATE OR REPLACE TRIGGER notify_investments
  AFTER INSERT OR UPDATE ON public.investments
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://alylgdjtlcnedvalzgke.supabase.co/functions/v1/notify-investor',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );

CREATE OR REPLACE TRIGGER notify_payments
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://alylgdjtlcnedvalzgke.supabase.co/functions/v1/notify-investor',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );

CREATE OR REPLACE TRIGGER notify_withdrawals
  AFTER INSERT OR UPDATE ON public.withdrawals
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://alylgdjtlcnedvalzgke.supabase.co/functions/v1/notify-investor',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );

CREATE OR REPLACE TRIGGER notify_investor_applications
  AFTER UPDATE ON public.investor_applications
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://alylgdjtlcnedvalzgke.supabase.co/functions/v1/notify-investor',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );

CREATE OR REPLACE TRIGGER notify_support_messages
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://alylgdjtlcnedvalzgke.supabase.co/functions/v1/notify-investor',
    'POST',
    '{"Content-Type":"application/json"}',
    '{}',
    '5000'
  );
