# SoulFrame V6.1.4 — Step 2: Candidate Revision-Safe Database Migration

**REVIEW ONLY — NOT APPLIED TO SUPABASE. No cloud edit/delete buttons or live RPC calls are enabled.**

Depends on V6.1.0 `20261020000100_hosted_projects.sql` and V6.1.4 Step 1's `cloudMutationContract.js`. The application on `v6-backend-foundation` remains V6.1.3 create/read-only until further verified steps.

## What the candidate migration does

1. Replaces the original `revision = 1` CHECK constraint with `revision >= 1`. Existing Revision 1 records stay valid. PostgreSQL `integer` bounds apply, and RPC updates refuse values at the maximum.
2. Adds `deleted_at timestamptz`, initially `NULL`, and changes the **owner-only SELECT RLS policy** to filter `deleted_at IS NULL`. Normal read/list sees only live rows.
3. **Does not grant direct UPDATE or DELETE** on `public.soulframe_projects`. Authenticated users retain the V6.1.0 SELECT and column-limited INSERT grants.
4. Creates two **private `SECURITY DEFINER`** functions inside `soulframe_private` (a schema that must not be in the Supabase API's Exposed schemas list), each with a pinned empty search path and explicit checks against `auth.role()` and `auth.uid()`.
5. Creates the minimally exposed RPC wrappers `public.sf_update_project_if_revision` and `public.sf_delete_project_if_revision` as **SECURITY INVOKER** functions. Execution is explicitly revoked from PUBLIC and anon, and granted only to authenticated accounts. The private functions similarly restrict their EXECUTE privileges. `authenticated` gets USAGE of the private schema solely for the invoker-to-definer call; do not expose this schema over the Data API.
6. Implements one-statement conditional metadata overwrite and **soft delete**, matching **ID + verified owner + active row + expected revision** in the same database mutation. Every successful mutation advances the revision, so two writers using the same revision cannot both succeed.

Both RPCs return a restricted JSON object with `status` equal to `ok`, `conflict`, or `not_found`. The Update RPC uses an **explicit response-field allowlist** matching the V6.1.3 hosted project reader; it does not serialize an entire database row, so future internal columns cannot leak automatically. Missing/non-owned projects return the same `not_found` response; another owner's metadata or existence is never disclosed. Invalid inputs and unauthenticated calls fail. Updates accept **exactly ten** metadata columns from the Step 1 full-replacement mapper (omitted optional values become explicit JSON `null`) and reject any extra keys, audio bytes or privileged fields.

## Soft deletion and recovery caveat

A Delete in the **eventual UI** would hide the record, not permanently erase it. Recovery, retention, lawful erasure and administrative cleanup still require a separately designed and tested pathway. Tombstoned records are **not** a substitute for backups; they remain in the database, including owner-linked client notes. The V6.1.0 `auth.users ON DELETE CASCADE` relationship could still remove them if the account itself is deleted.

No real client metadata or production Delete controls should be enabled before those questions are resolved. Step 2 makes no live changes; Step 3 must explicitly verify soft-delete invisibility and future recovery approach in a disposable Supabase project.

## Database security decisions

- PostgreSQL's function EXECUTE default includes PUBLIC unless revoked. A privileged `SECURITY DEFINER` function created by Supabase's dashboard/migration owner can bypass table RLS. This design therefore confines those implementations to a private schema **and checks `auth.uid()` against the row inside the functions**, rather than relying only on grants/RLS. The exposed wrappers use invoker privileges. Review the actual function owner, PostgREST exposure, schemas and linter findings before running it.
- Direct table UPDATE/DELETE stays revoked. The privileged mutation path is deliberately narrower than exposing `UPDATE` or `DELETE` with a client-supplied revision filter.
- The SQL candidate is **not** evidence of correct database behavior until Postgres executes it. Static tests don't verify SQL syntax, lock behavior, deployment policy configuration, privileges, or cross-tenant isolation.
- A conflict status must not be automatically retried. Refresh, inspect the new revision, and explicitly request a new action. A `not_found` status is intentionally ambiguous for nonexistent/other-owner/deleted rows.

## Required verification gates (subsequent steps)

1. Commit Step 1 + Step 2 **after** offline tests and review, without applying the SQL to Supabase.
2. Review migration against the **actual isolated database**: verify original constraint names and policy names, backups, exposed schemas, roles, and SQL Editor ownership. A Supabase branch labelled **PRODUCTION**, even within a project named Dev, must not be treated as disposable solely because it contains test-looking records. Inspect **Project Settings → Data API → Exposed schemas** and ensure `soulframe_private` is absent; take a tested backup or otherwise document rollback before any migration. Do not run on a production or client-data database. Execute migration once in the development project only after an explicit go-ahead.
3. Run `supabase/tests/revision_safe_cloud_mutations_contract.sql` in that same isolated database; it is a read-only catalog test, not a live authorization test.
4. Extend the two-account CLI harness to exercise the new RPCs using the **publishable** key and two separate authenticated sessions. Assert: own revision 1 → 2; stale overwrite denied; exactly one winner from concurrent same-revision writes; other-account update/delete denied; anonymous RPC denied; no direct table UPDATE/DELETE; stale delete denied; successful soft delete hidden from list/load even to owner; no cross-owner data visible. Inspect any unexpected status/error as a test failure.
5. Only after all live tests pass, add UI actions with confirmation, explicit revision previews, nonretrying conflict handling, and safeguards against sign-out during requests; then full browser QA and CI.

## Rollback constraints

This migration is a new **transactional, additive migration with explicit constraint replacement**, not an edit to the original V6.1.0 migration. Rollback is **not** simply dropping the new column/functions after test data has been updated or tombstoned; dropping `deleted_at` would silently unhide soft-deleted rows, and returning to `revision=1` would fail on higher revisions. Plan backup and data-safe rollback with the database owner before applying anything.

## References

- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/api/securing-your-api
