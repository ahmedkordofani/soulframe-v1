# SoulFrame V6.1.4 Step 3.3 — Confirmed Cloud Update UI

Status: **local integration candidate**, not yet browser-verified or shipped. Builds on the V6.1.4 Step 3.2 RPC client and live database update/security tests. No new SQL, production deployment, migration or credential change.

## User workflow

1. Sign in with a disposable test account. Choose **Refresh cloud projects**.
2. **Load** the cloud project to be edited. This clears browser audio and previous analysis as in V6.1.3. Modify its fields in the normal SoulFrame workspace.
3. Return to Cloud projects. Choose **Update from workspace** *on the intended cloud record*. The confirmation shows the target project's name, its revision, and the current workspace source name.
4. Only **Confirm cloud update** sends a metadata-only, owner-verified RPC. Success increases the revision. A conflict or inaccessible record cancels the action, clears the stale list and requires explicit Refresh. No automatic retry.
5. When testing, only use synthetic project names and notes in the disposable Supabase database.

This is a **full metadata replacement**, not a partial merge or autosync. Optional unset fields become NULL; do not update with an incomplete workspace if you want to retain prior notes. Export or copy important metadata before overwriting: cloud revision history and undo are not available. Updating does not create a browser backup automatically. Cloud soft-deletion UI is **not** enabled by Step 3.3.

## Safety rules

- Only the `sf_update_project_if_revision` RPC can update; no direct table UPDATE or DELETE.
- The target ID and expected revision are captured from the cloud list at click time and validated before confirmation.
- Current workspace metadata is copied when the action is requested, avoiding changes between review and confirmation.
- The server still checks authenticated owner + current revision atomically. A successful response is verified by `cloudMutations.js`.
- Account switching unmounts the per-account manager; delayed UI updates must not surface after sign-out.
- Audio never enters the cloud metadata payload. Browser saved-project and local API workflows are unchanged.

## Verify before commit

`node scripts/apply-v614-step33.mjs`

`npm run verify`

Manual: two synthetic cloud records, refresh, load/edit, confirm update, refresh, second-account list isolation, stale tab conflict and cancel, verify local/browser projects preserved. Leave Cloud Delete disabled. Record results before committing.
