# SoulFrame V6.0.5 - Local Project Recovery and Backup

## Scope

V6.0.5 extends the **loopback-only development API**. It does not add accounts, remote sync, cloud backups, audio uploads, or server-hosted report URLs.

The original `.soulframe-local/projects.json` schema stays at `schemaVersion: 1`. The optional `history` array stores earlier **project metadata** snapshots in the same file as active projects. Legacy files without this field still load normally.

## What is saved

- A snapshot is captured **before** each successful overwrite and delete.
- A successful restore of an existing record also snapshots the previous state, allowing that restoration to be undone.
- Snapshots keep the project name, client name, producer notes, other allowed project fields, review mode, preset, timestamps and revision. **They do not contain audio bytes or analysis data.**
- The newest 10 snapshots per project are retained, with a 5,000-snapshot database-wide cap. Older snapshots expire automatically.
- No history is available for changes made before V6.0.5.

## API routes

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/recovery` | List recovery snapshots with project revision and active/deleted status |
| `GET` | `/api/recovery/:snapshotId` | Inspect one snapshot's metadata before deciding to restore |
| `POST` | `/api/recovery/:snapshotId/restore` | Restore a snapshot explicitly and conditionally |
| `GET` | `/api/backup` | Export active projects and recovery history as JSON |

To restore an **existing** project, include `If-Match: "<current-revision>"`. To restore a **deleted** project, include `If-None-Match: *`. The precondition is checked under the store's write queue. Missing preconditions return `428`; stale preconditions return `412`. A successful restore increments the project's revision, even when restoring old content.

The `ProjectRecoveryPanel` is under **Product > Output > Saved Projects**. Preview and confirmation are required before recovery. Refresh history before selecting a snapshot after any concurrent edits. Restoring never loads the project into the active audio workspace automatically.

## Manual export

Select **Download metadata backup** to save a dated JSON file. It includes project and client names/notes, so store it privately. It does not automatically leave the machine and is not uploaded to an external service.

**Important:** This is export-only. The V6.0.5 interface does not import API backups. The separate pre-existing *browser saved-project backup* feature has its own format and is unchanged. If the local database is lost or corrupt, keep the manually downloaded JSON file for a future verified restore/migration workflow. Do not paste or merge it into the store while the API runs.

## Limitations and release checks

- The recovery history is in the **same JSON database file** as active projects. It protects against accidental overwrites/deletes, not complete disk loss or file corruption. Download independent backups regularly.
- Local API data isn't encrypted at rest or protected by user authentication. Never expose the server to the internet or use confidential real client metadata during this prototype phase.
- Single-process write serialization is not multi-process transactional locking. Do not run multiple API servers against one JSON file.
- Test with dummy data: create, overwrite, preview history, restore an edit, delete and restore, download a JSON backup, restart the API and repeat.
- Run `npm run verify` and test in the browser before committing.

## Next

V6.0.6 should focus on safer backup import/validation, export integrity checks and documented disaster-recovery boundaries before any cloud storage work.
