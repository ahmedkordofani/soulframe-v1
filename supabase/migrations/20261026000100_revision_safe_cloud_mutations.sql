-- SoulFrame V6.1.4 STEP 2 - REVIEW-ONLY migration candidate (allowlisted RPC response).
-- NOT APPLIED. NOT FOR PRODUCTION. Do not run until isolated-test review and approval.
-- Depends on 20261020000100_hosted_projects.sql.
-- Design: soft deletion + atomic revision compare-and-swap inside private SECURITY DEFINER
-- implementations, called via strictly limited public SECURITY INVOKER RPC wrappers.
-- Only use when the target project is CONFIRMED disposable/test; SQL Editor
-- branch labels such as 'PRODUCTION' require special caution and backup review.
-- Direct authenticated UPDATE / DELETE on soulframe_projects remains prohibited.

begin;

-- A V6.1.0 constraint pins revisions to 1, which disallows all future changes.
-- DROP is intentionally explicit: stop rather than silently change an unexpected schema.
alter table public.soulframe_projects
  drop constraint soulframe_projects_revision_check;
alter table public.soulframe_projects
  add constraint soulframe_projects_revision_check check (revision >= 1);

-- Use a tombstone rather than hard DELETE. This is not yet a user-facing recovery tool.
alter table public.soulframe_projects
  add column deleted_at timestamptz;

-- Deletion hides the row from normal owner-scoped SELECT, even direct Data API reads.
drop policy "sf_projects_select_own" on public.soulframe_projects;
create policy "sf_projects_select_own" on public.soulframe_projects
  for select to authenticated
  using (owner_id = (select auth.uid()) and deleted_at is null);

-- Defence in depth. INSERT stays column-restricted by the V6.1.0 grant.
revoke update, delete on table public.soulframe_projects from public, anon, authenticated;

-- PRIVATE schema must NOT be in Supabase Data API exposed schemas.
-- Use a new dedicated namespace to avoid reusing another private schema.
create schema soulframe_private;
revoke all on schema soulframe_private from public, anon, authenticated;

-- Only this narrow schema usage is needed for the authenticated INVOKER wrappers.
-- These implementations are protected by ownership/revision checks even if invoked via SQL.
grant usage on schema soulframe_private to authenticated;

create function soulframe_private.sf_update_project_if_revision(
  p_project_id uuid, p_expected_revision integer, p_changes jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $sf_update$
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

  -- Full-replacement contract: exactly the same ten allowlisted columns as Step 1.
  -- Null is allowed only for optional metadata; project name, mode, preset are strings.
  if p_changes is null or pg_catalog.jsonb_typeof(p_changes) is distinct from 'object' then
    raise exception 'Expected project metadata object' using errcode = '22023';
  end if;
  if (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(p_changes)) <> 10
     or exists (
       select 1 from pg_catalog.jsonb_object_keys(p_changes) as k(key)
       where k.key <> all (array[
         'project_name', 'client_name', 'track_type', 'ai_tool', 'current_stage',
         'main_concern', 'client_goal', 'producer_notes', 'review_mode', 'selected_preset'
       ]::text[])
     ) then
    raise exception 'Unexpected or missing project metadata field' using errcode = '22023';
  end if;
  if pg_catalog.jsonb_typeof(p_changes->'project_name') is distinct from 'string'
     or pg_catalog.length(pg_catalog.btrim(p_changes->>'project_name')) < 1
     or pg_catalog.length(p_changes->>'project_name') > 500
     or pg_catalog.jsonb_typeof(p_changes->'review_mode') is distinct from 'string'
     or p_changes->>'review_mode' not in ('draft', 'compare')
     or pg_catalog.jsonb_typeof(p_changes->'selected_preset') is distinct from 'string'
     or pg_catalog.length(p_changes->>'selected_preset') > 120 then
    raise exception 'Invalid required project metadata' using errcode = '22023';
  end if;
  if exists (
    select 1 from pg_catalog.jsonb_each(p_changes) as e(key, val)
    where e.key in (
      'client_name','track_type','ai_tool','current_stage','main_concern',
      'client_goal','producer_notes'
    ) and pg_catalog.jsonb_typeof(e.val) not in ('string', 'null')
  ) or exists (
    select 1 from pg_catalog.jsonb_each(p_changes) as e(key, val)
    where e.key in (
      'client_name','track_type','ai_tool','current_stage','main_concern','client_goal'
    ) and pg_catalog.length(e.val #>> '{}') > 500
  ) or pg_catalog.length(p_changes->>'producer_notes') > 4000 then
    raise exception 'Invalid optional project metadata' using errcode = '22023';
  end if;

  -- One atomic conditional UPDATE: a stale request can never overwrite newer work.
  update public.soulframe_projects as p
     set project_name = p_changes->>'project_name',
         client_name = p_changes->>'client_name',
         track_type = p_changes->>'track_type',
         ai_tool = p_changes->>'ai_tool',
         current_stage = p_changes->>'current_stage',
         main_concern = p_changes->>'main_concern',
         client_goal = p_changes->>'client_goal',
         producer_notes = p_changes->>'producer_notes',
         review_mode = p_changes->>'review_mode',
         selected_preset = p_changes->>'selected_preset',
         revision = p.revision + 1,
         updated_at = pg_catalog.clock_timestamp()
   where p.id = p_project_id
     and p.owner_id = v_user
     and p.deleted_at is null
     and p.revision = p_expected_revision
   returning p.* into v_row;
  if found then
    -- Return only the reviewed V6.1.3 metadata fields. Never serialize the full
    -- table row: new internal columns must not appear in RPC responses.
    return pg_catalog.jsonb_build_object(
      'status', 'ok',
      'project', pg_catalog.jsonb_build_object(
        'id', v_row.id,
        'owner_id', v_row.owner_id,
        'project_name', v_row.project_name,
        'client_name', v_row.client_name,
        'track_type', v_row.track_type,
        'ai_tool', v_row.ai_tool,
        'current_stage', v_row.current_stage,
        'main_concern', v_row.main_concern,
        'client_goal', v_row.client_goal,
        'producer_notes', v_row.producer_notes,
        'review_mode', v_row.review_mode,
        'selected_preset', v_row.selected_preset,
        'revision', v_row.revision,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at
      )
    );
  end if;
  -- No leakage: missing and other-owner IDs are indistinguishable.
  if exists (select 1 from public.soulframe_projects as p
             where p.id = p_project_id and p.owner_id = v_user and p.deleted_at is null) then
    return pg_catalog.jsonb_build_object('status', 'conflict');
  end if;
  return pg_catalog.jsonb_build_object('status', 'not_found');
end;
$sf_update$;

create function soulframe_private.sf_delete_project_if_revision(
  p_project_id uuid, p_expected_revision integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $sf_delete$
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

  -- Tombstone update is conditional and atomic. No hard DELETE is granted or executed.
  update public.soulframe_projects as p
     set deleted_at = pg_catalog.clock_timestamp(),
         updated_at = pg_catalog.clock_timestamp(),
         revision = p.revision + 1
   where p.id = p_project_id
     and p.owner_id = v_user
     and p.deleted_at is null
     and p.revision = p_expected_revision
   returning p.* into v_row;
  if found then
    return pg_catalog.jsonb_build_object('status', 'ok', 'id', v_row.id, 'revision', v_row.revision);
  end if;
  if exists (select 1 from public.soulframe_projects as p
             where p.id = p_project_id and p.owner_id = v_user and p.deleted_at is null) then
    return pg_catalog.jsonb_build_object('status', 'conflict');
  end if;
  return pg_catalog.jsonb_build_object('status', 'not_found');
end;
$sf_delete$;

-- API-visible wrappers are SECURITY INVOKER, never elevated. They delegate
-- to the private implementations, where owner_id = auth.uid() is mandatory.
create function public.sf_update_project_if_revision(
  p_project_id uuid, p_expected_revision integer, p_changes jsonb
)
returns jsonb
language sql
security invoker
set search_path = ''
as $sf_update_rpc$
  select soulframe_private.sf_update_project_if_revision(p_project_id, p_expected_revision, p_changes);
$sf_update_rpc$;

create function public.sf_delete_project_if_revision(
  p_project_id uuid, p_expected_revision integer
)
returns jsonb
language sql
security invoker
set search_path = ''
as $sf_delete_rpc$
  select soulframe_private.sf_delete_project_if_revision(p_project_id, p_expected_revision);
$sf_delete_rpc$;

-- PostgreSQL grants EXECUTE to PUBLIC by default. Lock BOTH layers explicitly.
revoke all on function soulframe_private.sf_update_project_if_revision(uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function soulframe_private.sf_delete_project_if_revision(uuid, integer) from public, anon, authenticated;
revoke all on function public.sf_update_project_if_revision(uuid, integer, jsonb) from public, anon, authenticated;
revoke all on function public.sf_delete_project_if_revision(uuid, integer) from public, anon, authenticated;

grant execute on function soulframe_private.sf_update_project_if_revision(uuid, integer, jsonb) to authenticated;
grant execute on function soulframe_private.sf_delete_project_if_revision(uuid, integer) to authenticated;
grant execute on function public.sf_update_project_if_revision(uuid, integer, jsonb) to authenticated;
grant execute on function public.sf_delete_project_if_revision(uuid, integer) to authenticated;

commit;
