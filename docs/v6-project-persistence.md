# SoulFrame V6.0.2 - Local Project Persistence

This milestone introduces **real local HTTP project metadata persistence**, not a remotely hosted multi-user backend. It is the foundation for a future explicit Save to API / Load from API UI in V6.0.3.

## Start locally

In one terminal run `npm run dev:api`; in a second run `npm run dev`. The API binds only to `127.0.0.1:8787`. All data is stored at `.soulframe-local/projects.json` in the repository's current working directory. This path is gitignored. Back it up manually if the data matters to you.

The browser's existing LocalStorage projects, backup format, and audio review remain untouched. **No automatic syncing** takes place. Do not use real client-sensitive metadata while working with this unauthenticated development server; do not expose the server to your LAN or internet.

## API endpoints

| Request | Purpose |
| --- | --- |
| `GET /api/health` | Check local API; `projectPersistence: true` |
| `GET /api/projects` | List project IDs, titles and timestamps (not full notes) |
| `POST /api/projects` | Explicitly create a new project |
| `GET /api/projects/:id` | Read full saved project metadata |
| `PUT /api/projects/:id` | Replace allowed text fields for an existing project |
| `DELETE /api/projects/:id` | Delete a local project |

The accepted body is a JSON object with a `projectSession` containing the same text field names as the existing browser project form, optional `reviewMode: "draft" | "compare"`, and optional `selectedPreset` text. Audio, files, arbitrary fields and excessively large payloads are rejected. The service has an upper limit of 1,000 projects and 16 KB/request.

## Quick PowerShell smoke test

```powershell
$api = 'http://127.0.0.1:8787'
Invoke-RestMethod "$api/api/health"
$body = @{ projectSession = @{ projectName = 'SoulFrame API Test'; clientName = 'Demo only' }; reviewMode = 'draft' } | ConvertTo-Json -Depth 5
$created = Invoke-RestMethod "$api/api/projects" -Method Post -ContentType 'application/json' -Body $body
$created.project.id
Invoke-RestMethod "$api/api/projects"
Invoke-RestMethod "$api/api/projects/$($created.project.id)"
Invoke-RestMethod "$api/api/projects/$($created.project.id)" -Method Delete
```

Use **only demo metadata** for this test. Project creation, reading and deletion are real writes to `.soulframe-local/projects.json`.

## Limitations and safeguards

- Localhost-only listening; basic Origin/Host checks; no CORS exposure.
- No authentication, authorization, user accounts, cloud synchronization, audio storage, encryption-at-rest or conflict resolution.
- Writes use temporary files and atomic renames; concurrent writes through one process are serialized.
- Corrupted existing storage is rejected without overwriting it.
- Existing browser projects are not migrated or touched. This feature is API-first, with no save-to-server UI yet.
- This JSON file is for local development, **not** the final production database or an appropriate place for confidential client records.

## Testing

`node --test tests/projectApi.test.mjs` runs the new project API tests. `npm run verify` runs all suites plus the Vite production build.

Next: V6.0.3 - Explicit frontend project API integration with confirmation and clear local/browser separation.
