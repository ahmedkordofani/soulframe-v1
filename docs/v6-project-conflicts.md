# SoulFrame V6.0.4 - Project Safety and Conflict Protection

## Purpose

The local API now rejects stale edits and deletions so two open browser tabs cannot silently overwrite one another through the same running Node process.

This is **optimistic concurrency control**, not a hosted or authenticated database.

## Revision contract

- Each new record starts at `revision: 1`.
- `GET /api/projects` includes each record's revision in the list summaries.
- `GET /api/projects/:id` returns the record and `ETag: "<revision>"`.
- `PUT /api/projects/:id` requires an `If-Match` header equal to the record's latest revision and increments the revision on success.
- `DELETE /api/projects/:id` requires the current revision as `If-Match`.
- Missing precondition: HTTP `428 Precondition Required`.
- Valid but stale precondition: HTTP `412 Precondition Failed`, no write or delete.
- Malformed precondition: HTTP `400 Bad Request`.
- Unknown project ID with a valid precondition: HTTP `404 Not Found`.

Example: `If-Match: "2"` means the user reviewed revision 2. It only permits changing the record if revision 2 is still the current version.

## Browser interaction

Product > Output > Saved Projects > Local API Projects:

1. Refresh the API project list to obtain the current revisions.
2. Save a demonstration project. New records start at revision 1.
3. Use a second tab to refresh, then overwrite the project (revision becomes 2).
4. In the first tab, attempt an overwrite or deletion using the older revision 1.
5. SoulFrame must cancel the stale action, display a conflict warning and refresh the list.
6. Review the latest project data before explicitly trying again. No automatic retry is performed.

Loading an API project still asks for confirmation and clears any attached audio/analysis from the prior workspace. Browser LocalStorage projects stay independent.

## Compatibility

Existing `.soulframe-local/projects.json` records created in V6.0.2 or V6.0.3, with no `revision` key, are treated as revision 1. Their next successful update writes revision 2. The JSON schema stays at version 1. No automatic rewriting or deletion happens on startup.

## Verification

```powershell
npm run verify
```

Use only test metadata in this local unauthenticated API.

## Important limitations

- Per-process write serialization is used. Do **not** run multiple Node API instances against one storage JSON file. A later database-backed implementation will need transactional compare-and-swap operations for cross-process safety.
- The local API listens on `127.0.0.1`. Host and Origin checks mitigate unwanted access but are not a substitute for authentication.
- This release does not add automatic history, undo, snapshots, backups, encryption, remote sync or hosted report links. Export browser backups yourself before larger changes.
- Project metadata including client names and producer notes is stored unencrypted on the local machine. Do not use sensitive customer material while developing.
- The public Vercel demo remains browser-only; the local API is not deployed.
