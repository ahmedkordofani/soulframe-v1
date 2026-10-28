# SoulFrame V6.1.4 Step 3.2 — RPC adapter, no UI

## Status

**Offline client code only. No cloud Update or Delete buttons.** Do not merge/deploy without verifying all existing repository checks, then add the confirmation and conflict-refresh UI in a separate step.

## Operations

- `updateCloudProject(client, projectId, expectedRevision, metadata)`: verifies Supabase identity with `getUser()`, validates a full allowlisted metadata replacement, calls `sf_update_project_if_revision`, and checks the returned owner, ID and incremented revision. Never retries a conflict.
- `softDeleteCloudProject(client, projectId, expectedRevision)`: validates a revision precondition, verifies identity, calls `sf_delete_project_if_revision`, and checks the returned ID/revision. Never performs a direct table DELETE.
- Both return `status: 'ok' | 'conflict' | 'not_found'`; only `ok` includes a project for update or ID/revision for deletion. Unexpected server responses fail closed.
- The database remains authoritative for owner checks, revision concurrency and soft-deletion rules.

## Recovery policy required before any UI

Soft deletion is **not user-facing undo**. V6.1.4 should either (a) include and live-test a separate owner-scoped, revision-safe Restore workflow before offering a Delete button, or (b) state prominently that removal is not recoverable by the user and require a second explicit confirmation. Do not promise rollback or restore merely because an admin can see `deleted_at` rows.

## Verification

After extracting into `soulframe-v1` run `npm run verify` and `git status --short`.

No SQL migration changes, secrets, browser storage, local API or audio processing changes are part of this package. Do not commit until verification is reviewed.
