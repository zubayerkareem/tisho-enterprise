-- Add transaction screenshot URL to investments
alter table public.investments
  add column if not exists transaction_screenshot_url text;

-- Storage: transaction-screenshots bucket (private)
insert into storage.buckets (id, name, public)
values ('transaction-screenshots', 'transaction-screenshots', false)
on conflict (id) do nothing;

-- Storage RLS: investors can upload files under their own user_id prefix
create policy "investor: upload own transaction screenshot"
  on storage.objects for insert
  with check (
    bucket_id = 'transaction-screenshots'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: investors and admins can read files
create policy "investor/admin: read transaction screenshot"
  on storage.objects for select
  using (
    bucket_id = 'transaction-screenshots'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
