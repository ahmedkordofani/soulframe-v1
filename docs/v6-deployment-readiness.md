# SoulFrame V6.0.9 - Backend Architecture and Deployment Readiness

## Scope and status

This release **does not deploy the backend** or introduce production authentication. It separates local development from hosted requirements with an executable **fail-closed runtime guard**, a **read-only local storage audit**, and a CLI readiness report. Existing browser sessions and all JSON project/recovery/backup formats are unchanged.

## Run the checks

From the SoulFrame project root:

```powershell
npm run backend:readiness
npm run backend:readiness -- --target=local --json
npm run backend:readiness -- --target=hosted
npm run verify
```

- `local` evaluates the current environment and reads `.soulframe-local/projects.json` only if it exists. No project names, tokens, client notes, IDs or raw audio are printed. Missing storage is normal on first start. A malformed storage file blocks readiness without modifying it.
- `hosted` **must fail**, with implementation gaps listed. It is a planning gate, **not** a production security audit or green light to deploy.
- A local pass means only that the checked environment and JSON format are compatible with the local prototype. It does not prove resilience, security or data quality.
- A nonzero exit code is expected for blocked checks. CI runs unit tests for these boundaries.

## Local runtime boundary

- The Node API binds to `127.0.0.1`, accepts loopback requests only, validates Host/Origin, applies development request limits and requires a process-scoped owner token to access data.
- Attempting to start the API in `NODE_ENV=production`, when common hosting-platform environment markers are present, or with configured remote binding/origin hints now throws an explicit startup error.
- `SOULFRAME_DEPLOYMENT_TARGET` accepts only `local` or `development`. `SOULFRAME_API_HOST`, if specified, may only be `127.0.0.1` or `localhost`; it does not change the fixed loopback binding.
- `SOULFRAME_ALLOWED_ORIGIN`, if specified, must be an HTTP localhost or `127.0.0.1` origin with an explicit port (no path). It is not an allowance for remote hosting.
- Runtime checks protect against accidental misconfiguration, **not** malicious local code, filesystem access, malicious extensions or sophisticated intrusion. They cannot detect every hosting provider.
- Don't set production variables merely to bypass the gate. No bypass or `ALLOW_PUBLIC` feature is provided.

## Current architecture

```text
React / Vite web app
  |-- localStorage projects and browser audio analysis (independent)
  |-- explicit Save / Load / Recovery / Backup UI
         |
     Vite dev proxy (/api)
         |
     Node local API on 127.0.0.1:8787
       - loopback + origin and Host checks
       - temporary owner token (not real user auth)
       - optimistic project revisions and recovery
         |
       .soulframe-local/projects.json
       [single local process, unencrypted metadata JSON]
```

The public Vercel frontend remains a **browser-first prototype**. The Vite dev proxy is not a production API deployment. No audio bytes are stored in the local API; project names and producer notes **can** be stored in plain JSON locally.

## Hosting prerequisites: all required before public backend deployment

1. **User identity and sessions:** adopt a real identity provider; validate signed tokens server-side, enforce token expiry, and handle account recovery/revocation.
2. **Per-user authorization:** add owner IDs to records; enforce each action and recovery/backup endpoint against the authenticated owner, ideally with database row-level security plus explicit API checks.
3. **Transactional persistence:** replace process-local JSON and in-memory preview tokens with a managed relational database such as Postgres, with atomic revision checks, migrations, consistency tests, encrypted managed backups and documented deletion policy.
4. **Host security:** place services behind TLS, control secrets, restrict cross-origin access, apply production rate limits, request limits and deployment-specific network configuration.
5. **Metadata privacy:** define retention, access/deletion, encryption, acceptable content, consent for migration and clear notice to users. Never automatically upload client projects or audio.
6. **Observability and operations:** add security-event auditing without leaking confidential data, error monitoring, staged releases, backup/restore drills, and incident response.
7. **Secure share links (later):** owner-controlled report publishing, random non-guessable links, expiry/revocation and preview authorization; don't reuse local backup tokens for this purpose.

### Suggested eventual architecture (not committed to a provider)

- Web app: existing Vite/React deployment.
- Auth: managed provider (for example, Supabase Auth), verified on every backend request.
- Data: Postgres with owner-isolated records, RLS (when available), migrations and backups.
- API: dedicated trusted server or hosted function layer that validates identity and authorization.
- Reports: metadata and explicit consent first. Keep analysis files browser-local unless a future feature requires and justifies secure storage.

No cloud credentials, hosted endpoints or actual multi-tenant database code are added in V6.0.9.

## Compatibility and rollback

- No migrations or writes happen during readiness checks.
- Local project/recovery/backup schema stays at its existing `schemaVersion: 1`.
- To roll back code, revert the V6.0.9 commit. Local data is not modified by the upgrade.
- A local startup error means the *API process* is blocked; the Vite UI still supports its independent browser-only workflow.
- Test using demo data; client metadata and exported backup JSON are not encrypted at rest.

## Acceptance checklist

- `npm run verify` succeeds after local dependencies are installed.
- `npm run backend:readiness` reports local PASS with a valid or absent local store.
- `npm run backend:readiness -- --target=hosted` reports BLOCKED (expected).
- Starting local API in a production-marked environment refuses startup.
- Starting the API normally still generates a private owner token; CRUD/recovery/backup UI work with that token.
- Existing saved browser projects and all local JSON backup/history features continue working.
- Never deploy `server/index.mjs` publicly as a substitute for a production backend.
