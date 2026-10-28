# SoulFrame V6.1.4 — Step 3.19: Cloud Recovery Client

This stage introduces only `src/hosted/cloudRecovery.js`. It is not wired to the UI.

## Boundaries

- `listDeletedCloudProjects(client)` invokes public `sf_list_deleted_projects`, requiring a verified user before and after the RPC. Only up to 24 tombstones are returned, with `id`, `project_name`, `revision`, and `deleted_at`.
- `restoreCloudProject(client, projectId, expectedRevision)` invokes public `sf_restore_project_if_revision` after validating the target. It returns `ok`, `conflict`, or `not_found` and never retries a stale revision automatically.
- A Restore confirmation and a freshly loaded tombstone revision are mandatory when the UI is added in a later step. **Do not invoke Restore automatically.**
- The database's owner and revision checks remain authoritative; client checks are defence in depth.
- Audio is not stored in the cloud; Restore recovers only project metadata.
- Error details from Supabase are not displayed to users.
- Neither Cloud Delete nor Restore buttons are introduced here. Browser and local API workflows are untouched.

## Environment and release

The V6.1.4 Restore migration has been applied to the disposable SoulFrame Dev database and passed the Step 3.17 live two-account restore test. The known tombstone `SF-V614-DELETE-01556940-ebb` is now **active at revision 4**; never rerun the one-time restore test. New UI tests must use new synthetic records.

This package does not include service-role keys, credentials, `.env` files, server actions, SQL migrations, or database writes. Review and run `npm run verify` before continuing. Do not commit or push until the complete milestone is verified.
