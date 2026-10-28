# SoulFrame V6.1.4 — Step 2.9: Live soft-deletion security check

This is an **opt-in live integration check for a disposable development Supabase database only**. It is not a production feature. The newly introduced SQL RPC may already be callable by test accounts, but **SoulFrame's Delete UI remains disabled**.

## What will change

`node --env-file=.env.rls.local scripts/verify-cloud-soft-delete-v614.mjs --live` signs in to the same two independent test accounts used in V6.1.2, confirms anonymous access is denied, creates **one** project whose name begins with `SF-V614-DELETE-`, updates that project from revision 1 to revision 2, then confirms stale and cross-owner deletions do nothing. It finally soft-deletes **only that newly created project** using its known ID and current revision.

The script tests that the RPC returns revision 3, owner and other-account normal SELECTs hide the tombstone, direct table writes are still denied, a second deletion is rejected, and a later update cannot resurrect it. The synthetic row is intentionally **retained** for DB-admin tombstone verification; the script performs **no hard DELETE** and contains no cleanup action.

The project's earlier `Untitled AI Draft` and `SF-V614-UPDATE-*` records are not targeted. Project IDs for destructive calls are taken solely from the row just created by this test. Only synthetic names/notes are used.

## Runbook

1. Confirm `.env.rls.local` still points **exclusively** to the disposable test Supabase instance. Do not run if unsure or if it points to a production or customer database.
2. Extract the package at the `soulframe-v1` repository root.
3. Run `npm run verify` (offline: no test data is created).
4. Run `node scripts/verify-cloud-soft-delete-v614.mjs --help` to inspect the scope.
5. Run `node --env-file=.env.rls.local scripts/verify-cloud-soft-delete-v614.mjs --live` **once**. A nonzero exit or `FAIL` means stop. Do not automatically retry, because an interrupted script may have created a partial synthetic record.
6. After a full pass, open Supabase's SQL Editor for the disposable project and run the read-only `supabase/tests/verify_v614_soft_delete_tombstone.sql`. Identify the specific marker printed by the script. That row should be revision 3 and `expected_tombstone = true`.

Do **not** rerun the V6.1.4 migration or grant direct UPDATE/DELETE. Do **not** delete the test row manually until the tombstone inspection passes.

## Safety notes

- Uses only `sb_publishable_...` and two ordinary authenticated accounts. The script prints no credentials or tokens.
- `--help` is offline; only `--live` sends a request.
- The script cannot itself prove physical row retention because RLS intentionally hides tombstones; the SQL Editor query provides the independent database evidence.
- A soft-delete is not yet a user-recoverable delete. No Restore UI, automatic backup, or retention/cleanup policy exists yet.
- This test does not exhaustively assess concurrent update-vs-delete races; verify those separately before releasing the UI.
