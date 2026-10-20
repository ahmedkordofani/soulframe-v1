-- SoulFrame V6.1.0: proposed hosted project metadata table for a future Supabase deployment.
-- DO NOT deploy until the RLS tests, identity setup and hosting review have been performed.
-- This migration is intentionally limited to SELECT and INSERT for authenticated users.
-- No public project updates, deletes, recovery, shared links, audio or automatic sync.

create table public.soulframe_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_name varchar(500) not null check (length(btrim(project_name)) > 0),
  client_name varchar(500),
  track_type varchar(500),
  ai_tool varchar(500),
  current_stage varchar(500),
  main_concern varchar(500),
  client_goal varchar(500),
  producer_notes varchar(4000),
  review_mode text not null default 'draft' check (review_mode in ('draft', 'compare')),
  selected_preset varchar(120) not null default '',
  revision integer not null default 1 check (revision = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index soulframe_projects_owner_updated_idx
  on public.soulframe_projects (owner_id, updated_at desc);

alter table public.soulframe_projects enable row level security;

-- Supabase project defaults vary. Revoke first, then grant the narrow required operations.
revoke all on table public.soulframe_projects from public, anon, authenticated;
grant select on table public.soulframe_projects to authenticated;
-- Only these fields may be supplied by callers. id, owner_id, revision and timestamps use DB defaults.
grant insert (
  project_name, client_name, track_type, ai_tool, current_stage,
  main_concern, client_goal, producer_notes, review_mode, selected_preset
) on table public.soulframe_projects to authenticated;

create policy "sf_projects_select_own"
  on public.soulframe_projects
  for select to authenticated
  using (owner_id = (select auth.uid()));

create policy "sf_projects_insert_own"
  on public.soulframe_projects
  for insert to authenticated
  with check (owner_id = (select auth.uid()));

-- Deliberately NO UPDATE or DELETE grants/policies in V6.1.0.
-- Atomic revision checks, deletion and recovery must be designed and tested first.
