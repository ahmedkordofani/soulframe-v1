-- READ-ONLY CATALOG INSPECTION. Use only AFTER Step 3.13 migration is applied.
-- Successful execution returns two rows with anon_allowed = false and
-- authenticated_allowed = true. It does not test ownership or concurrency.
select
  'public.sf_list_deleted_projects' as rpc,
  pg_catalog.has_function_privilege('anon', 'public.sf_list_deleted_projects()', 'EXECUTE') as anon_allowed,
  pg_catalog.has_function_privilege('authenticated', 'public.sf_list_deleted_projects()', 'EXECUTE') as authenticated_allowed
union all
select
  'public.sf_restore_project_if_revision',
  pg_catalog.has_function_privilege('anon', 'public.sf_restore_project_if_revision(uuid,integer)', 'EXECUTE'),
  pg_catalog.has_function_privilege('authenticated', 'public.sf_restore_project_if_revision(uuid,integer)', 'EXECUTE');
