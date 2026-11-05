-- QuotePilot: each account can only read and change its own data.
--
-- Run this in Supabase → SQL Editor AFTER the security-hardening code is deployed.
-- Shared invoice links (/p/<id>) and crypto payment checks now read invoices on the server,
-- so the database no longer needs to let the public (anon) role read or update invoices.
--
-- What it does, for quotes, clients and profiles:
--   1. turns on Row Level Security
--   2. removes every existing policy (including any "anyone can read" ones)
--   3. adds one policy per table: a signed-in user may read and write only their own rows

begin;

alter table public.quotes   enable row level security;
alter table public.clients  enable row level security;
alter table public.profiles enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public' and tablename in ('quotes', 'clients', 'profiles')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

create policy "Own quotes" on public.quotes
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Own clients" on public.clients
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Own profile" on public.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

commit;

-- Check afterwards (should list exactly the three policies above):
-- select tablename, policyname, roles, cmd from pg_policies where schemaname = 'public';
