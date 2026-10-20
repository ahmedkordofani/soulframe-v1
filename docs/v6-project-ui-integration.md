# V6.0.3 - Project API Integration

## Scope

The local project API now has a manually operated UI in Product > Output > Saved Projects.
It is deliberately separate from the browser snapshot list.

## Supported actions

- Refresh: reads the local API project summaries
- Save new: sends the active project fields as a new record, with no automatic sync
- Load: confirm replacing active project fields, mode and preset; clears previous uploaded audio filenames, URLs, metadata and analysis
- Overwrite: confirm replacing a chosen server record with the CURRENT project metadata
- Delete: confirm permanent removal of the chosen server record

## Privacy and limitations

The allowed field list is `src/api/projectMetadata.js`, aligned to `server/projectStore.mjs`.
Project names, client names and notes are sent **only when Save or Overwrite is confirmed**.
Loading/listing are read-only requests. Audio and analysis stay in the browser.
No accounts, remote sync, hosted links, encryption or public deployment are included.
The Node server binds to 127.0.0.1 and is for local development only.

## Acceptance test

1. Start `npm run dev:api`, then `npm run dev` in separate terminals.
2. Navigate to Output > Saved Projects. Existing browser project snapshots are still available.
3. Save a test-only project to Local API; refresh and verify the new entry.
4. Load it after changing current project details; confirm the active project updates and any previous audio/analysis clears.
5. Overwrite the entry after editing the active project; confirm only after reviewing the warning.
6. Delete the entry; confirm it disappears from the API list without changing browser project snapshots.
7. Stop the API, then verify browser saves and reports still work; restart API and test project list again.
8. Run `npm run verify` and confirm production build plus all tests pass.

## Known gaps

- No conflict detection between two browser tabs updating the same server record.
- No authentication, encryption at rest or cloud sync.
- Metadata only; audio must be reuploaded after loading a project.
- Manual browser testing and production build are still needed for full validation.
