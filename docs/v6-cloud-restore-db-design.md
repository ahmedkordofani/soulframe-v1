# SoulFrame V6.1.4 — Step 3.13: Cloud recovery RPC proposal

**Status: source review only — not applied.** This package does not change Supabase or the SoulFrame interface.

## Background

V6.1.4 currently soft-deletes cloud records by setting `deleted_at` and incrementing the revision. Normal authenticated SELECT deliberately hides these tombstones, so a recoverable deletion UI requires two narrowly scoped endpoints instead of loosening that policy.

## Proposed RPCs

| Public RPC | Authenticated response | Access rules |
|---|---|---|
| `sf_list_deleted_projects()` | `{status:'ok',projects:[{id,project_name,revision,deleted_at}]}` max 24 rows | Owner only; only `deleted_at IS NOT NULL` |
| `sf_restore_project_if_revision(id,expected_revision)` | `{status:'ok',id,revision}`, `{status:'conflict'}` or `{status:'not_found'}` | Owner, tombstone, exact revision; atomic update |

Both APIs delegate to `SECURITY DEFINER` implementations in `soulframe_private` using `SET search_path = ''`, qualified table/function names, explicit `auth.role()` and `auth.uid()` checks. Both public wrappers are `SECURITY INVOKER`. No direct table UPDATE or DELETE grants are added. The private schema must stay absent from the exposed schemas list. PostgreSQL function EXECUTE privileges must remain denied to `anon`.

The list response never includes notes, client names, audio or a full serialized row. The restore response only includes the ID and incremented revision. A stale revision yields `conflict`, while unknown, active and other-owner IDs yield `not_found` without revealing existence. If a deleted record is restored, it becomes visible through the existing normal SELECT policy. **No UI feature or account recovery guarantee is implied by this SQL alone.**

## Before applying any migration

1. Independently review SQL logic and grants. Confirm schema matches the previously applied V6.1.4 migration.
2. Verify the Supabase target is an isolated disposable dataset, despite any `main (PRODUCTION)` label, and preserve a database-level rollback or recovery plan. A CSV export is not a complete backup.
3. Verify `soulframe_private` remains excluded from Data API exposed schemas.
4. Use two authenticated non-privileged test accounts. After applying on the test database, validate anonymous denial, cross-account tombstone listing and restore denial, stale restore conflict, correct revision increment, double restore and update/restore race semantics.
5. Ensure browser audio and local API records remain completely separate.
6. Only **after** live restore tests, create a confirmed Deleted Projects → Restore UI. Enable Cloud Delete only after that UI and the user-facing warning are verified.

## Not in this step

- No schema migration execution; no database writes or network calls
- No Restore/Delete buttons or automatic cloud sync
- No hard deletion, retention expiry, bulk recovery or audio recovery
- No Git commit/push

## Design edge cases for live verification

- Restore only uses a *current tombstone revision*. An older revision cannot revive a newer tombstone.
- Two simultaneous restore calls: one wins; the other should report `not_found` because it is no longer a tombstone.
- Restore and update cannot both succeed against the same tombstone: update rejects deleted rows.
- A user who owns a deleted row sees only their own minimal metadata; another user sees an empty list.
- No automatic restore after page load or after a conflict; users must explicitly confirm.
