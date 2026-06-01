-- Add whatsapp column to profiles
alter table public.profiles add column if not exists whatsapp text;

-- Update handle_new_user to capture phone + whatsapp from signup metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, phone, whatsapp)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'whatsapp_number'
  );
  return new;
end;
$$;
