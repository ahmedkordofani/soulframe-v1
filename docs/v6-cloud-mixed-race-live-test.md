# SoulFrame V6.1.4 - Step 3.1: Mixed Update/Delete Race Test

## Status and guardrails

This script is an **optional live test**, not an application feature. It verifies that the Supabase RPCs serialize competing UPDATE and soft-DELETE calls against **one newly created synthetic project**. It must run only on a confirmed disposable Supabase instance with the reviewed V6.1.4 migration and catalog checks already applied/passed. The two test users, URL and publishable key come from the git-ignored `.env.rls.local` file used for V6.1.2; credentials are not logged. Do not use admin or service-role keys. The SQL Editor may display `main (PRODUCTION)` even for a test project, so separately confirm you are using only disposable data.

`--help` is offline. `--live` creates exactly **one** `SF-V614-RACE-*` test record, then races update and delete using **expected_revision = 1**. The valid outcomes are:

1. Update wins and increments revision to 2; Delete returns `conflict`; the active updated row remains visible.
2. Soft delete wins and increments revision to 2; Update returns `not_found`; the tombstone is hidden from the normal owner listing.

Any other combination, provider error, or cross-owner visibility causes failure. The test does **not** hard-delete, restore, or update preexisting projects. It leaves the row/tombstone behind for eventual administrative cleanup. Soft deletion is **not** a user-facing restore feature.

## Commands

From the SoulFrame repository root, after extracting the ZIP:

```powershell
npm run verify
node scripts/verify-cloud-race-v614.mjs --help
node --env-file=.env.rls.local scripts/verify-cloud-race-v614.mjs --live
```

Expected successful last line: `RESULT: PASS (8 live assertions). Winning operation: update.` **or** `... delete.` (the winner is nondeterministic). If a check fails, stop and inspect the relevant synthetic record. Do not rerun automatically, toggle Data API permissions, or reuse the existing test project's UUIDs.

Cloud editing and deletion remain disabled in the UI. A proper recovery/retention policy, live two-account tests, application error handling, and review of service security are required before making deletion available to users.
