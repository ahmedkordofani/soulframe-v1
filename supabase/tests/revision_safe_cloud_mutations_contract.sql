-- SoulFrame V6.1.4 Step 2: READ-ONLY DB catalog inspection.
-- Do not run until the Step 2 migration has been applied in an isolated Supabase
-- development project after explicit review. Tests privileges, NOT concurrency.
do $contract$
declare
  v_schema_exposed boolean;
  v_row_security boolean;
  v_checks integer;
  v_function record;
  v_update_definition text;
begin
  select c.relrowsecurity into v_row_security
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'soulframe_projects';
  if v_row_security is distinct from true then
    raise exception 'Hosted projects must retain RLS';
  end if;
  if pg_catalog.has_table_privilege('anon', 'public.soulframe_projects', 'SELECT')
     or pg_catalog.has_table_privilege('authenticated', 'public.soulframe_projects', 'UPDATE')
     or pg_catalog.has_table_privilege('authenticated', 'public.soulframe_projects', 'DELETE') then
    raise exception 'Direct table access expanded beyond safe SELECT/INSERT';
  end if;
  if pg_catalog.has_column_privilege('authenticated', 'public.soulframe_projects', 'revision', 'UPDATE')
     or pg_catalog.has_column_privilege('authenticated', 'public.soulframe_projects', 'deleted_at', 'UPDATE')
     or pg_catalog.has_column_privilege('authenticated', 'public.soulframe_projects', 'owner_id', 'UPDATE')
     or pg_catalog.has_column_privilege('authenticated', 'public.soulframe_projects', 'deleted_at', 'INSERT') then
    raise exception 'Privileged columns must remain unwriteable by direct table grants';
  end if;
  if pg_catalog.has_schema_privilege('anon', 'soulframe_private', 'USAGE')
     or not pg_catalog.has_schema_privilege('authenticated', 'soulframe_private', 'USAGE') then
    raise exception 'Private helper schema ACL is unexpected';
  end if;
  if pg_catalog.has_function_privilege('anon', 'public.sf_update_project_if_revision(uuid, integer, jsonb)', 'EXECUTE')
     or pg_catalog.has_function_privilege('anon', 'public.sf_delete_project_if_revision(uuid, integer)', 'EXECUTE')
     or pg_catalog.has_function_privilege('anon', 'soulframe_private.sf_update_project_if_revision(uuid, integer, jsonb)', 'EXECUTE')
     or pg_catalog.has_function_privilege('anon', 'soulframe_private.sf_delete_project_if_revision(uuid, integer)', 'EXECUTE') then
    raise exception 'Anonymous function calls must be denied';
  end if;
  if not pg_catalog.has_function_privilege('authenticated', 'public.sf_update_project_if_revision(uuid, integer, jsonb)', 'EXECUTE')
     or not pg_catalog.has_function_privilege('authenticated', 'public.sf_delete_project_if_revision(uuid, integer)', 'EXECUTE') then
    raise exception 'Authenticated wrappers must be callable';
  end if;
  for v_function in
    select n.nspname, p.proname, p.prosecdef, p.proconfig
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where (n.nspname = 'soulframe_private' or n.nspname = 'public')
       and p.proname in ('sf_update_project_if_revision', 'sf_delete_project_if_revision')
  loop
    if v_function.prosecdef is distinct from (v_function.nspname = 'soulframe_private') then
      raise exception 'Private implementation must be DEFINER and public wrapper must be INVOKER';
    end if;
    -- PostgreSQL stores SET search_path = '' as search_path="" in
    -- pg_proc.proconfig. Accept both exact empty representations, but reject
    -- a missing setting or any non-empty search_path assignment.
    if not exists (
      select 1 from pg_catalog.unnest(v_function.proconfig) as cfg(setting)
      where cfg.setting in ('search_path=', 'search_path=""')
    ) or exists (
      select 1 from pg_catalog.unnest(v_function.proconfig) as cfg(setting)
      where cfg.setting like 'search_path=%'
        and cfg.setting not in ('search_path=', 'search_path=""')
    ) then
      raise exception 'Every mutation function must pin an empty search_path';
    end if;
    v_checks := coalesce(v_checks, 0) + 1;
  end loop;
  if v_checks is distinct from 4 then
    raise exception 'Exactly two private and two public mutation functions are required';
  end if;
  -- Safety regression: if internal table columns are added later, the
  -- update RPC must not return them by serializing the entire row.
  select pg_catalog.pg_get_functiondef(
      'soulframe_private.sf_update_project_if_revision(uuid, integer, jsonb)'::regprocedure
  ) into v_update_definition;
  if v_update_definition like '%to_jsonb(v_row)%'
     or v_update_definition like '%row_to_json(v_row)%'
     or v_update_definition not like '%''project'', pg_catalog.jsonb_build_object(%' then
    raise exception 'Update RPC must return an explicit project field allowlist';
  end if;
  if not exists (
    select 1 from pg_catalog.pg_policies
    where schemaname = 'public' and tablename = 'soulframe_projects'
      and policyname = 'sf_projects_select_own'
      and qual like '%deleted_at IS NULL%'
  ) then
    raise exception 'Owner SELECT policy must hide soft-deleted rows';
  end if;
end;
$contract$;
