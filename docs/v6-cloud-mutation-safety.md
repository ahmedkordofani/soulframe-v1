# SoulFrame V6.1.4 — Revision-Safe Cloud Mutations: Step 1 Safety Contract

**Status: design and offline request validation only. Nothing is applied to Supabase. There are no cloud editing/deletion buttons, database grants, or mutation network calls in this step.**

## Baseline and scope

- Base branch: `v6-backend-foundation` after V6.1.3 commit `e303c48`.
- Existing cloud project create/list/load is operational for synthetic test data. Audio and analysis are browser-only.
- Existing `public.soulframe_projects` migration is **create/read-only**, granting `SELECT` and column-limited `INSERT` to `authenticated`. RLS restricts reads/inserts to the owner.
- `revision` currently has the database constraint `CHECK (revision = 1)`. This **must change in a reviewed future migration** before any update is possible.
- The development-only password sign-in and local Node API are independent. Keep all credentials in ignored local files; never commit them.

## Mutation contract (prepared in `cloudMutationContract.js`)

- Every update/delete must name a UUID project ID **and the revision the user reviewed**. Missing/invalid revisions fail locally. Updates cannot increment beyond the PostgreSQL `integer` maximum.
- UPDATE represents a **full overwrite** of permitted project metadata: project name, client name, track type, AI tool, current stage, main concern, client goal, producer notes, review mode and preset. Optional omitted fields become `NULL`. No arbitrary fields or audio are accepted.
- DELETE receives only ID and expected revision. The JS helper is not a security boundary; the database must independently check identity, owner, revision and allowed columns.
- `owner_id`, database-generated `id`, `revision`, `created_at`, and `updated_at` are never supplied as editable fields.
- No automatic retries on conflicts. The user must refresh and review before choosing another action.

## Proposed database boundary — **not implemented here**

1. Add an independently reviewed migration that relaxes the `revision = 1` constraint into a positive, safely incrementing integer, **without granting direct table UPDATE or DELETE**.
2. Prefer a dedicated **non-exposed private schema** for narrowly scoped `SECURITY DEFINER` implementations. Set `search_path = ''`, qualify every relation, check `auth.uid()` **inside** the function, and restrict EXECUTE. If called via Supabase REST RPC, expose only a minimal `SECURITY INVOKER` wrapper in an API-exposed schema. Confirm the private schema is not API-exposed. Audit the grants on the wrapper and private implementation.
3. Perform updates atomically in PostgreSQL, with an ownership and revision predicate similar to `WHERE id = p_project_id AND owner_id = auth.uid() AND revision = p_expected_revision`, while atomically incrementing revision and setting `updated_at` in the same statement. Do not implement read-then-write without a transactional condition.
4. Make deletes conditional on the same owner/revision pair. Before enabling deletion beyond synthetic testing, decide and verify a **recovery or backup** mechanism, retention, and a clear confirmation flow. Prefer a tested soft-delete/trash mechanism over irreversible deletion for real projects.
5. Return an unambiguous success/conflict/not-found result **without disclosing the existence or metadata of another user's row**. Privately-owned rows with a changed revision are conflicts; nonowned/missing rows must be indistinguishable to unauthorized callers.
6. Keep RLS and the original SELECT/INSERT restrictions. No secret/service-role key is ever used in the frontend.

## Mandatory acceptance tests *before activating cloud mutation controls*

- SQL catalog/grants: anonymous execution denied; no direct UPDATE/DELETE grants; restricted RPC execute; protected private function ownership and search path. Assess security-definer linter warnings carefully.
- Live tests through the actual Supabase Data API against a disposable test project with two independent authenticated users: own update succeeds and increments revision; stale update blocked; concurrent updates from the same revision admit exactly one winner; stale delete rejected; cross-account update/delete blocked (both by guessed ID and direct table attempts); anonymous requests denied.
- Ensure malformed metadata, invalid revision, owner spoofing, unexpected database errors, session switch mid-request, and sign-out during requests all fail closed.
- A successful update appears on later list/load; previously loaded stale records cannot overwrite it. Deleted rows disappear only for their rightful owner; prove recovery/backup behavior before enabling production deletion.
- Full `npm run verify` plus browser tests. Existing browser project saving, local API, audio clearing on load and V6.1.2 ownership harness continue to work.

## Explicit gates

**Step 1 (this package):** Pure request builder, tests and this safety contract. No DB changes.

**Step 2 (future):** Implement and review server-side transactional mutation and recovery design in a *non-deployed migration*, with real SQL checks. Do not run it on production.

**Step 3 (future):** Execute in isolated Supabase development instance and test two-account concurrent operations and denied actions. Only then add explicit, confirmed UI actions and run cross-browser regression checks.

## Reference

Supabase security guidance (check latest wording before writing SQL):
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
