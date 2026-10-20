# SoulFrame V6.1.0 - Hosted Backend Architecture

**Status: design and source foundation only. NOT DEPLOYED, NOT USER AUTHENTICATION.**

## Scope

V6.1.0 introduces a candidate PostgreSQL/Supabase Auth data model for **explicitly saved project metadata**. It does not connect to Supabase, create an account, migrate browser data, upload audio, change the local JSON database or make the Vercel demo a hosted API.

### Deployment boundary

```text
CURRENT (unchanged)
React/Vite browser -> explicit local Node API (127.0.0.1) -> local JSON
                         Local owner token, NOT cloud auth

FUTURE (not implemented)
React/Vite -> Supabase Auth -> authenticated Data API / trusted server
                                     -> PostgreSQL project rows, RLS
```

The local API MUST remain local and its `npm run backend:readiness -- --target=hosted` check MUST stay **BLOCKED**. Do not deploy `server/index.mjs` or expose its temporary owner token. Never put Supabase `service_role` / secret keys in browser variables or commit secrets.

## Included files

- `supabase/migrations/20261020000100_hosted_projects.sql`: a **candidate** schema migration. It creates `public.soulframe_projects` with `owner_id` referencing `auth.users`, server-generated IDs/timestamps and explicit allowed metadata fields. It enables RLS, revokes default API role privileges, then grants only `SELECT` plus column-limited `INSERT` to `authenticated`. Owner-only policies are defined for select and insert. **Direct UPDATE and DELETE are deliberately unavailable.**
- `supabase/tests/hosted_projects_contract.sql`: read-only SQL catalog smoke check for required grants and RLS policy presence. Requires a real Supabase Postgres instance with the migration applied; it does **not** simulate two accounts or prove access isolation.
- `src/hosted/projectMapper.js`: browser-safe pure map from SoulFrame project metadata to permitted hosted INSERT columns. Does not send HTTP requests, tokens, audio or client data anywhere.
- `scripts/hosted-schema-check.mjs`: static design guard (`npm run hosted:contract`). It cannot parse or execute all PostgreSQL syntax or establish deployed security.
- `tests/hostedArchitecture.test.mjs`: mapper tests and static SQL contract guardrails. Previous local API tests continue unchanged.

## Data and ownership rules

| Data | Hosting plan |
| --- | --- |
| Project name, optional client name, project type and producer notes | Explicit opt-in metadata only, later |
| `owner_id` | PostgreSQL default `auth.uid()` from a verified Supabase session; not accepted as an insert field |
| IDs, revision and timestamps | Database-generated; revision is limited to `1` until atomic update semantics are implemented |
| Audio files, stems, analysis buffers | Browser-only, no hosted storage in this phase |
| Recovery snapshots, backup export/import | Existing local API only; no hosted migration |
| Shared links / client access | Not designed or implemented |

The candidate table has a foreign key to `auth.users` with `ON DELETE CASCADE`. Account deletion, associated backup retention and compliance policies must be assessed and tested before deployment.

## Provider decision and trade-offs

**Candidate**: Supabase Auth + PostgreSQL + RLS, while retaining the existing React frontend and Vercel deployment. Benefits: established managed auth, SQL constraints, explicit user ownership, and database-layer authorization. Risks: Supabase project configuration, account lifecycle, direct Data API access and database privileges must be reviewed; migrations and backup policies need operational ownership. This is a proposed choice, not a provisioned or connected service.

The `public` schema is API-exposed in typical Supabase configurations. V6.1.0 therefore uses `REVOKE` plus narrow grants and RLS in the same migration. Review the deployed project's actual privileges, since platform defaults vary. **Policies alone do not remove grants.**

## Verification and required acceptance before any cloud connection

1. Locally: `npm run hosted:contract`, `npm test`, `npm run verify`. The hosted readiness check must still report `BLOCKED`.
2. In an isolated throwaway Supabase project, after reviewing the migration and recording the database owner, apply `supabase/migrations/20261020000100_hosted_projects.sql` using your established migration process. **This is not an instruction to execute on a production database.**
3. Run the SQL smoke check in `supabase/tests/hosted_projects_contract.sql` against that isolated test database.
4. Perform real **allow and deny** integration tests using at least two different authenticated accounts and an anonymous request: each user can insert and select *only* their own projects, cannot insert with another owner, cannot modify owner/revision fields or update/delete records, and cannot query someone else's projects or notes. Verify via the *actual Data API*, not merely SQL inspection. Add these tests to CI before enabling hosted saves.
5. Verify session expiry, revoked accounts, correct key placement, error redaction, privacy notices, opt-in saving, rate limits, logs, backup retention, and account deletion behavior.
6. Plan revision-safe SQL `UPDATE`/`DELETE` and recovery before granting those operations to clients. A naive direct `UPDATE` would bypass the local API's conflict contract.
7. Determine access-control, project deletion and metadata backup expectations before adding client report sharing.

## Rollback and data safety

Installing the V6.1.0 source ZIP changes no API runtime behavior and performs no database migration. The SQL file remains unexecuted. To roll back locally, revert the V6.1.0 code commit. If a test database migration was applied, plan rollback with a database backup and ownership review; avoid dropping tables on a database containing real user records. Browser localStorage and `.soulframe-local/projects.json` stay untouched.

## Next increment

**V6.1.1 - Hosted Identity Integration (development-only)**: Introduce a real Supabase Auth client behind an explicit configuration gate, sign-in/out and session handling, with browser-only fallback. This should not upload metadata until cross-user RLS integration testing has passed. Secrets must stay server-side; frontend may hold a Supabase publishable/anon key only.
