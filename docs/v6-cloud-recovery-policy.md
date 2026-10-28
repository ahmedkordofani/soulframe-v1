# SoulFrame V6.1.4 — Cloud deletion and recovery policy (design, not enabled)

## Current state (verified 2026-10-27)

- Cloud Save, Load and revision-checked Update have passed development-browser checks.
- The backend has passed synthetic-only soft-delete, ownership and stale-revision checks.
- **The application MUST NOT expose Cloud Delete yet.** There is no secure user-facing restore path. A soft-deleted row remains in PostgreSQL but is hidden from normal project queries.
- Browser storage and local API records are separate; audio stays in the browser.

## Required recovery workflow before enabling Cloud Delete

1. Display a separate **Deleted cloud projects** section only after authentication and an explicit Refresh action. It must use a narrow, authenticated, owner-scoped server RPC to list tombstones. Never loosen normal project SELECT policies or make `deleted_at` accessible as a writeable client column.
2. Offer **Restore** per tombstone using a secure RPC which validates `auth.uid()`, checks `deleted_at is not null`, and compares the supplied expected tombstone revision atomically before setting `deleted_at` to NULL and advancing revision by one. Stale requests return `conflict`; missing/other-owner projects return `not_found` without leaking existence.
3. Require explicit user confirmation for Restore. Do not automatically restore, recreate a cloud record or upload audio. Refresh the cloud list manually after stale-state errors.
4. Only once list and restore are tested against both authenticated test accounts should the app offer a separate, explicitly confirmed **Move to deleted projects** action for active records. The message must explain that cloud metadata is hidden until restored; audio is never stored in the cloud.
5. No automatic retention purge or hard DELETE in V6.1.4. A separate irreversible-deletion design requires its own review, recovery strategy and tests.

## Security and acceptance criteria

- Keep `soulframe_private` outside Data API exposed schemas. Only allowlisted `public` RPCs are exposed, with execute privileges restricted to `authenticated` and no direct table UPDATE or DELETE permissions.
- Use explicit, fixed JSON response columns (never return `to_jsonb(row)` wholesale).
- Test own-account tombstone listing, cross-owner isolation, anonymous denial, stale restore rejection, delete/restore races, revision increment, post-restore normal listing, and no changes to unrelated rows.
- No UI changes to Delete/Restore are part of Step 3.12. This document is a future implementation contract, not a claim that recovery is available.

## Environment

Work only in the isolated, disposable SoulFrame Dev dataset with synthetic metadata. The Supabase dashboard's `main (PRODUCTION)` branch label is not proof of safety. Backups of project metadata do not replace database rollback plans.
