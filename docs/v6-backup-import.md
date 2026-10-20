# V6.0.6 - Safe Local Backup Import

1. Start local API with `npm run dev:api` and the frontend with `npm run dev`.
2. Open Product > Output > Saved Projects, and refresh API projects.
3. In Recovery and backup, select a JSON file downloaded from **Download metadata backup**.
4. Review the number of new project IDs and recovery snapshots, and the number of IDs skipped because they already exist.
5. Tick the acknowledgement and confirm. A preview is valid for five minutes and only if the database has not changed in the meantime.
6. Refresh your projects and manually load imported records if needed. No browser workspaces are changed automatically.

## Safety boundaries

- Only backups with the exact `soulframe-local-api-metadata-backup` format, schema v1, valid IDs and whitelisted project metadata are accepted. Unknown fields including audio and arbitrary JSON are rejected.
- Import is **additive only**. Existing project IDs never get overwritten, updated or deleted by import. History tied to existing project IDs is skipped too.
- Deletion history from a backup can be imported even when its project is absent. Recover those snapshots separately using the explicit recovery workflow.
- Every preview becomes invalid if the local database changes after preview, even if a different tab made the change. A stale import fails closed with HTTP 412.
- The import file must be <= 3 MiB; oversized payloads are rejected. At most 1,000 active projects and 5,000 recovery snapshots remain supported. Snapshot history is capped at 10 per project.
- This uses the existing single-process JSON store. It is not transactional across multiple simultaneous API processes. Keep independent backups in a private location.
- There is no authentication or encryption at rest. Never expose the development API publicly or import sensitive client data.

## API

- `POST /api/backup/preview` with exported backup JSON. Returns a temporary token and import plan, does not write data.
- `POST /api/backup/import` with `{ "token": "..." }`. Applies the exact validated plan only if the database is unchanged and the token is valid.

Run `npm run verify` and perform manual two-tab stale-preview checks before committing.
