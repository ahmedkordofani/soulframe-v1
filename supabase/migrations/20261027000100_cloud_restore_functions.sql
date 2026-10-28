-- SoulFrame V6.1.4 Step 3.13 — REVIEW-ONLY, NOT APPLIED.
-- Do NOT execute until explicitly reviewed against the isolated test database.
-- Requires the successfully applied V6.1.4 revision-safe mutations migration.
-- This candidate adds owner-scoped tombstone listing and atomic restore, but NO UI.
-- It does not create any table, alter RLS, or grant table UPDATE / DELETE.
-- soulframe_private MUST remain excluded from Supabase Data API exposed schemas.

begin;

-- List only minimal metadata required to identify one's own deleted projects.
-- The private implementation may bypass row-level SELECT: owner_id MUST be checked.
create function soulframe_private.sf_list_deleted_projects()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $sf_list_deleted$
declare
  v_user uuid;
begin
  if (select auth.role()) is distinct from 'authenticated' then
    raise exception 'Authenticated session required' using errcode = '42501';
  end if;
  v_user := (select auth.uid());
  if v_user is null then
    raise exception 'Verified identity required' using errcode = '42501';
  end if;

  return pg_catalog.jsonb_build_object(
    'status', 'ok',
    'projects', coalesce(
      (
        select pg_catalog.jsonb_agg(
          pg_catalog.jsonb_build_object(
            'id', d.id,
            'project_name', d.project_name,
            'revision', d.revision,
            'deleted_at', d.deleted_at
          ) order by d.deleted_at desc, d.id desc
        )
        from (
          select p.id, p.project_name, p.revision, p.deleted_at
          from public.soulframe_projects as p
          where p.owner_id = v_user
            and p.deleted_at is not null
          order by p.deleted_at desc, p.id desc
          limit 24
        ) as d
      ),
      '[]'::jsonb
    )
  );
end;
$sf_list_deleted$;

-- Restore metadata only. The tombstone's current revision is mandatory.
-- One conditional UPDATE gives atomic compare-and-swap against competing requests.
create function soulframe_private.sf_restore_project_if_revision(
  p_project_id uuid, p_expected_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $sf_restore$
declare
  v_user uuid;
  v_row public.soulframe_projects%rowtype;
begin
  if (select auth.role()) is distinct from 'authenticated' then
    raise exception 'Authenticated session required' using errcode = '42501';
  end if;
  v_user := (select auth.uid());
  if v_user is null then
    raise exception 'Verified identity required' using errcode = '42501';
  end if;
  if p_project_id is null or p_expected_revision is null
     or p_expected_revision < 1 or p_expected_revision >= 2147483647 then
    raise exception 'Invalid project ID or expected revision' using errcode = '22023';
  end if;

  update public.soulframe_projects as p
     set deleted_at = null,
         revision = p.revision + 1,
         updated_at = pg_catalog.clock_timestamp()
   where p.id = p_project_id
     and p.owner_id = v_user
     and p.deleted_at is not null
     and p.revision = p_expected_revision
   returning p.* into v_row;
  if found then
    return pg_catalog.jsonb_build_object(
      'status', 'ok', 'id', v_row.id, 'revision', v_row.revision
    );
  end if;
  -- Never disclose the existence of another owner's or an active project.
  if exists (
    select 1 from public.soulframe_projects as p
     where p.id = p_project_id
       and p.owner_id = v_user
       and p.deleted_at is not null
  ) then
    return pg_catalog.jsonb_build_object('status', 'conflict');
  end if;
  return pg_catalog.jsonb_build_object('status', 'not_found');
end;
$sf_restore$;

-- Only public SECURITY INVOKER wrappers are intended for the Data API.
create function public.sf_list_deleted_projects()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $sf_list_deleted_rpc$
  select soulframe_private.sf_list_deleted_projects();
$sf_list_deleted_rpc$;

create function public.sf_restore_project_if_revision(
  p_project_id uuid, p_expected_revision integer
)
returns jsonb
language sql
security invoker
set search_path = ''
as $sf_restore_rpc$
  select soulframe_private.sf_restore_project_if_revision(p_project_id, p_expected_revision);
$sf_restore_rpc$;

-- Created functions default to PUBLIC EXECUTE. Revoke at BOTH layers,
-- in the same transaction, then grant only to authenticated.
revoke all on function soulframe_private.sf_list_deleted_projects() from public, anon, authenticated;
revoke all on function soulframe_private.sf_restore_project_if_revision(uuid, integer) from public, anon, authenticated;
revoke all on function public.sf_list_deleted_projects() from public, anon, authenticated;
revoke all on function public.sf_restore_project_if_revision(uuid, integer) from public, anon, authenticated;

grant execute on function soulframe_private.sf_list_deleted_projects() to authenticated;
grant execute on function soulframe_private.sf_restore_project_if_revision(uuid, integer) to authenticated;
grant execute on function public.sf_list_deleted_projects() to authenticated;
grant execute on function public.sf_restore_project_if_revision(uuid, integer) to authenticated;

commit;
