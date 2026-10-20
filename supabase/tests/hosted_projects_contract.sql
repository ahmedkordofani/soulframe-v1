-- Optional database-level grant/RLS smoke checks. Requires a provisioned Supabase
-- Postgres database with the V6.1.0 migration applied. Does not write data.
-- These catalog checks are NOT a substitute for allow/deny tests with two real users.
do $$
declare
  rls_enabled boolean;
  policy_count integer;
begin
  select c.relrowsecurity into rls_enabled
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'soulframe_projects';
  if coalesce(rls_enabled, false) is not true then
    raise exception 'soulframe_projects must enable RLS';
  end if;
  if has_table_privilege('anon', 'public.soulframe_projects', 'SELECT') or
     has_table_privilege('anon', 'public.soulframe_projects', 'INSERT') then
    raise exception 'Anonymous users must not access hosted projects';
  end if;
  if not has_table_privilege('authenticated', 'public.soulframe_projects', 'SELECT') then
    raise exception 'Authenticated users need SELECT with RLS';
  end if;
  if has_table_privilege('authenticated', 'public.soulframe_projects', 'UPDATE') or
     has_table_privilege('authenticated', 'public.soulframe_projects', 'DELETE') then
    raise exception 'Direct hosted UPDATE/DELETE must remain disabled in V6.1.0';
  end if;
  if has_column_privilege('authenticated', 'public.soulframe_projects', 'owner_id', 'INSERT') or
     has_column_privilege('authenticated', 'public.soulframe_projects', 'revision', 'INSERT') then
    raise exception 'Caller-controlled owner_id or revision insert is prohibited';
  end if;
  select count(*) into policy_count from pg_policies
    where schemaname = 'public' and tablename = 'soulframe_projects'
      and policyname in ('sf_projects_select_own', 'sf_projects_insert_own');
  if policy_count <> 2 then
    raise exception 'Two owner-only policies are required';
  end if;
end $$;
