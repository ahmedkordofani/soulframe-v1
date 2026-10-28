# SoulFrame

**AI Music Humanization Review Tool**

SoulFrame is an experimental, browser-first tool for music producers reviewing AI-generated drafts. It turns basic audio measurements and review notes into human-led revision priorities, before/after comparisons, producer reports, and client communication.

**Principle:** AI can assist the creative process, but the final emotional and musical decisions still need a human ear.

## Live Demo

https://soulframe-v1.vercel.app

**Release note:** This URL is the public demo. V6.1.4 is verified on the `v6-backend-foundation` development branch; do not assume the public demo includes these development-beta cloud features until a separate deployment is approved.

## Current Version

**V6.1.4 - Revision-safe Cloud Project Editing, Soft Deletion and Recovery (development beta)**

V6.1.4 completes an **opt-in, authenticated cloud project metadata workflow** backed by the configured SoulFrame Dev Supabase project using synthetic test records. Under **Product > Output > Saved Projects**, a verified test account can explicitly **Save, Refresh, Load, Update, Soft Delete and Restore** project metadata. These operations are user-initiated; there is **no automatic synchronization**.

- **Account isolation:** Owner-scoped project access is checked against Supabase Auth. Two-account live verification was performed against synthetic records in that configured Supabase project; cross-account reads and mutations were rejected in those tests.
- **Revision-safe updates:** Updates use an expected revision and fail closed on stale state rather than silently overwriting another change. The UI requires explicit confirmation.
- **Recoverable cloud deletion:** Delete marks metadata as deleted and removes it from the active list. Deleted-project metadata can be refreshed and explicitly restored with a current-revision check. **No permanent cloud deletion is provided.**
- **Audio stays local:** Cloud operations send project text metadata (which can include client names and producer notes), not audio files, stems, browser analysis or report audio. A restored cloud project does not restore audio.
- **Separate workflows:** Browser-saved projects, browser backups and the loopback-only local Node API remain separate from hosted Supabase projects.

### Verification and release status

- The synthetic two-account live tests covered owner isolation, direct-write restrictions, revision conflicts, soft deletion and restoring a tombstone. They are **separate from** the ordinary local unit-test command and are not evidence of full production security.
- The `v6-backend-foundation` branch passed GitHub Actions on **28 October 2026**, including **301 tests passing, 0 failures** and a Vite production build. Local verification also passed with one environment-dependent test skipped.
- V6.1.4 is a **development beta**, not an approved public release. Its SQL changes were exercised with synthetic records in the SoulFrame Dev Supabase project; SQL files in the repository are **not automatically applied** by GitHub or Vercel. The public `main` release and hosted deployment require separate review.

```powershell
npm run hosted:contract   # Static schema/invariant checks; not a live database security test
npm test                  # Node unit/integration tests
npm run verify            # Node tests + Vite production build
npm run backend:readiness -- --target=hosted   # Review hosted-readiness blockers before release
```

**Security boundary:** V6.1.4 uses owner/revision-checked Supabase RPC operations, restricted database privileges and Row Level Security. The RPC implementations use a private schema that must **not** be exposed through the Data API; direct authenticated table UPDATE/DELETE remain prohibited. Do not use service-role keys in the frontend. Never run development migrations against a production database without a reviewed rollout and backup plan. Use synthetic metadata until deployment, security and privacy checks are approved.

Read [cloud mutation safety](docs/v6-cloud-mutation-safety.md), [cloud recovery policy](docs/v6-cloud-recovery-policy.md), [cloud restore UI](docs/v6-cloud-restore-ui.md), [V6.1.2 ownership verification](docs/v6-ownership-verification.md), [V6.1.1 hosted identity setup](docs/v6-hosted-identity.md) and [deployment readiness](docs/v6-deployment-readiness.md).

The Product flow remains **Dashboard -> Analyze -> Report -> Output -> Advanced**. Audio measurements are technical decision aids for producers, not verified AI-artifact detection.

## V6.1.1 Optional Hosted Identity

V6.1.1 introduced the **optional email one-time-code identity panel** at **Product > Output > Saved Projects**. It remains inactive without Supabase configuration. Browser-only and local API workflows continue to work separately.

The project uses the official Supabase client (declared in `package.json`; install dependencies with `npm ci`):

```powershell
npm ci
```

Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your own Supabase project. Only publishable keys belong in Vite variables. The sign-in email template must include `{{ .Token }}` for a one-time code. V6.1.1 uses memory-only sessions and does not automatically create accounts. Configure a known test account in Supabase Auth first.

At the **V6.1.1 milestone**, hosted identity did not yet provide cloud project storage; that limitation was superseded by V6.1.3 and V6.1.4's opt-in development-beta metadata workflows described above. There is still **no audio upload, automatic metadata sync, hosted report sharing or approved production deployment**. Existing local API ownership tokens remain separate from Supabase identities. Do not expose service-role or secret keys to the browser. Details: [V6.1.1 identity setup](docs/v6-hosted-identity.md).

## V5.4 Highlights

- **V5.4.1 - Report Workspace Cleanup:** Prioritised the clean producer/client report. Comparison appears when two analyses are ready; deeper report tools are collapsed by default.
- **V5.4.2 - Output Workspace Cleanup:** Organized client delivery, supporting outputs and saved projects into focused sections.
- **V5.4.3 - Advanced Workspace Cleanup:** Grouped technical and historical panels into smaller navigable categories.
- **V5.4.4 - Modularization and Bundle Optimization:** Lazy-loaded secondary pages, added React vendor chunking and removed the previous 500 KB single-chunk warning.
- **V5.4.5 - Classic Demo Isolation:** Moved legacy demo presentation into a lazy-loaded module.
- **V5.4.6 - Analysis Logic Extraction:** Moved 35 audio-analysis helpers into a dedicated module without changing their calculations.
- **V5.4.7 - Report Logic Extraction:** Moved 28 report builders into a dedicated module and introduced the shared project template.
- **V5.4.8 - Product State and Session Cleanup:** Extracted localStorage helpers and a React session hook while preserving storage keys and backup format.
- **V5.4.9 - Architecture Integration and Regression Testing:** Added `npm run verify`, integration tests, GitHub Actions and a browser QA checklist.
- **V5.4.10 - Final Architecture Review and Release Handoff:** Synced version documentation, documented architecture boundaries, release risks and acceptance gates.

## Core Features

- Browser-local audio inspection and technical proxies for clipping, dynamics, brightness and texture variation
- Producer review priorities and humanization action plans
- Before/after review and a case-study presentation format
- Producer/client report previews and TXT downloads
- Browser-native text sharing or clipboard copy where supported
- Saved project metadata, localStorage persistence, and JSON backup import/export
- Optional Supabase development-beta cloud metadata saves, revision-safe updates, recoverable soft deletion and manual restoration
- Classic Demo and educational/developer panels, separate from the primary workflow

**Important:** The audio analysis does not reliably determine whether a recording was AI-generated, identify specific AI synthesis artifacts, or measure emotional authenticity. It supplies technical clues for human listening and review. Certain demo progress and planning sequences are simulated.

## Project Structure

```text
src/
  App.jsx                      # Main shell and remaining UI/planning logic
  analysis/audioAnalysis.js    # Browser audio measurements and review helpers
  core/projectDefaults.js     # Shared project intake defaults
  session/sessionStorage.js   # Local persistence and backup helpers
  session/useProjectSessions.js
  report/reportBuilders.js    # Report builder functions
  report/CleanReportPreview.jsx
  report/BeforeAfterCaseStudy.jsx
  report/ClientDeliveryExperience.jsx
  report/ReportSharingExportHandoff.jsx
  report/ReportWorkspaceCleanup.jsx
  product/ProductWorkspace.jsx
  output/OutputWorkspace.jsx
  advanced/AdvancedWorkspace.jsx
  demo/ClassicDemo.jsx        # Lazy-loaded legacy interface
  views/SecondaryViews.jsx    # Lazy-loaded secondary pages
  hosted/                     # Optional authenticated cloud metadata UI and workflows

tests/
  reportBuilders.test.mjs
  sessionStorage.test.mjs
  integration.test.mjs
  architecture.test.mjs
  cloudRestoreUi.test.mjs     # Cloud restore UI guardrails
  cloudDeleteUi.test.mjs      # Cloud delete UI guardrails

supabase/
  migrations/                 # Reviewed SQL changes; not auto-applied
  tests/                      # Database safety assertions and checks

docs/
  quality-checklist.md
  architecture-v5.4.md
  release-handoff-v5.4.md
```

The architecture is substantially more modular than V5.3 but not fully separated. `App.jsx` still contains significant UI and legacy orchestration code.

## Development

Requires Node.js 22 (the version used by GitHub Actions).

```bash
npm ci
npm run dev
```

Run automated tests:

```bash
npm test
```

Run the tests and a production build together:

```bash
npm run verify
```

The same verification runs in GitHub Actions on pushes to `main`, `v5-*` and `v6-*` branches, and on pull requests. These checks do not perform live Supabase ownership tests. Browser acceptance testing remains necessary; see [docs/quality-checklist.md](docs/quality-checklist.md).

## Privacy and Prototype Limitations

Audio inspection and report generation operate in the browser; there is no required audio upload backend. Browser project/session data can be lost if local site data is cleared, so export a separate backup before clearing or migrating it.

An explicitly configured **Supabase development beta** now offers authenticated accounts and persistent **cloud project metadata**. It stores only the metadata you choose to save, including possible client names and producer notes, so **do not use confidential client information in test projects**. Cloud metadata storage is not an audio backup, automatic synchronisation or a general disaster-recovery guarantee. Soft-deleted cloud metadata can be manually restored, but audio cannot. The browser project store, local JSON API and Supabase account are distinct.

SoulFrame still does **not** provide hosted audio storage, secure client report links, revocable report-sharing permissions, server-generated PDFs or a production-approved public API. The local Node API uses loopback-only JSON persistence and a process-scoped owner token; it is not the same as Supabase multi-account authorization. The V4.1 API work was a prototype scaffold.

## Next Chapter

**Release readiness and real-world validation**

Before merging V6.1.4 into `main` or enabling its cloud features for public users, review deployment environment separation, Supabase schema/function exposure, SQL rollout and rollback procedures, privacy/consent, monitoring and data-retention rules. Keep using synthetic metadata during this review. The GitHub CI pass and Supabase live tests are **necessary checks, not a production sign-off**. The Supabase dashboard labels the project's `main` database branch `PRODUCTION`, even though the project is being used for development; verify environment separation before any further schema changes.

Then validate the producer workflow with representative tracks and real creative feedback. Any future hosted audio storage or client sharing needs a separate security and product design. See [deployment boundaries](docs/v6-deployment-readiness.md) and [architecture risks](docs/architecture-v5.4.md).

## Release History

- V4.0.0 - Deeper Audio Intelligence
- V4.1.0 - Backend/API Prototype Scaffold
- V4.2.0 - Smarter Humanization Reports
- V5.0.0 - Product UX Simplification
- V5.1.0 - Real Layout Refactor
- V5.2.0 - Visual Polish and Public Beta Presentation
- V5.3.0 - Report Sharing and Export
- V5.4.0 - UI Simplification and Codebase Cleanup (published)
- V6.1.0 - Hosted Backend Architecture
- V6.1.1 - Optional Hosted Identity
- V6.1.2 - Database Ownership Verification
- V6.1.3 - Authenticated Cloud Project Save and Load (development beta)
- V6.1.4 - Revision-safe Cloud Update, Soft Delete and Restore (development beta; GitHub CI verified)


## V6.0.4 - Project Safety and Conflict Protection

Project records now include a monotonically increasing `revision` number. The local API includes that revision in list and read responses, and the read endpoint returns an `ETag` such as `"1"`.

- Updating and deleting **requires** `If-Match: "<revision>"`.
- A missing revision returns HTTP `428 Precondition Required`.
- A stale revision returns HTTP `412 Precondition Failed`; the existing project is left unchanged.
- The Saved Projects interface shows revision numbers, sends the selected revision, cancels stale actions and refreshes the list; it **never retries overwrites or deletes automatically**.
- Pre-existing V6.0.2/V6.0.3 JSON records lacking `revision` are treated as revision 1 and continue to work without migration steps.
- The local JSON format stays at schemaVersion 1, and audio and analysis are never sent to the API.

This only protects against stale writes within **one local API process**. It is not database-level locking across multiple server processes, cloud authentication, a backup system, or safe public hosting. Do not run multiple API servers against the same JSON file. Read the [technical notes and test steps](docs/v6-project-conflicts.md).

## V6.0.3 - Local Project API Integration

The **Output > Saved Projects** workspace now has a separate Local API Projects panel.
With the local Node server running, you can explicitly:

- Save the current project's metadata as a new server record
- Refresh and list local API records
- Load a record into the current workspace (with confirmation and audio-state reset)
- Overwrite an existing API record (with confirmation)
- Delete an API record (with confirmation)

Browser LocalStorage saves and backups remain independent. Nothing syncs automatically. The API receives only allowlisted text project metadata (including client name and producer notes), review mode, and selected preset. It never receives audio files or analysis results. This loopback-only development server has **no authentication**; do not use sensitive client material or expose it to the internet.

To try it: open two terminals and run `npm run dev:api` and `npm run dev`; then open **Product > Output > Saved Projects**. Use **Refresh API projects** or **Save current project to local API**.

## V6.0.2 Local project metadata

The development API listens on 127.0.0.1 and stores explicitly submitted, text-only project metadata under `.soulframe-local/projects.json` (gitignored). Use `npm run dev:api` alongside `npm run dev`. There is no authentication or remote storage, so do not expose this development service to the network. Existing browser LocalStorage saves remain untouched; V6.0.3 allows explicitly saving the current project as a separate API record, not automatic migration of browser backups. Run `npm run verify` to test and build.

## V6.0.6 - Backup Import and Validation

In **Product > Output > Saved Projects**, choose a previously downloaded SoulFrame API JSON metadata backup and **Preview backup import**. The server validates all records before preparing a short-lived import plan. Review the number of new projects and skipped existing IDs, then explicitly confirm. The server rejects an expired or stale preview; imported data never replaces an existing project. Eligible recovery history is merged for non-colliding IDs only. No audio is ever included.

The local API remains unauthenticated, bound to loopback and intended for demonstration data only. Keep metadata backups private. This is not cloud sync, multi-user persistence or a disaster recovery guarantee.

## V6.0.5 - Project Recovery and Manual Metadata Backup

- Capture the previous project metadata revision before each successful API overwrite and deletion.
- Keep up to ten recovery snapshots per project in the original schema version 1 JSON database, including older projects.
- Review earlier snapshots in **Product > Output > Saved Projects** and restore with explicit confirmation.
- Require conditional requests to prevent stale restorations overwriting newer changes.
- Download an independent JSON file containing the local API's project and recovery metadata. This includes client names and producer notes and must be kept private.
- No backup import, remote sync, audio upload, accounts, or cloud hosting has been added.

Recovery snapshots share the same local database file as active projects, so they do not protect against total file loss or corruption. See [V6.0.5 recovery documentation](docs/v6-project-recovery.md).


## V6.0.7 - Local Backend Security and Privacy Hardening

The loopback-only development API now validates browser request context more strictly, sends defensive response headers, rejects announced oversized JSON bodies early, limits repeated metadata requests and uses HTTP timeouts. The existing local project database and backup format remain unchanged.

This is not login authentication, authorization, encryption at rest or a secure public deployment. Keep the API bound to 127.0.0.1, keep .soulframe-local private, and use demo metadata until a proper security architecture is implemented.


## V6.0.8 - Local Owner Access

The normal `npm run dev:api` command now generates a cryptographically random, process-scoped local owner token and prints it only in the **backend terminal**. Open `npm run dev` in a second terminal, then navigate to **Product > Output > Saved Projects** and enter the token to unlock API projects. The token is held in browser tab memory and is cleared by the Lock projects button or a page refresh. Restarting the API generates a fresh token.

- The `/api/health` endpoint is public and only reports capabilities. Project, recovery and backup requests require `Authorization: Bearer <token>`.
- Existing browser LocalStorage project saves work without the API or its token. No project data is transferred until an explicit action.
- The local owner token is **not** user account authentication, per-project authorization, multi-user isolation or encryption at rest.
- Do not publish the token, store it in code or browser LocalStorage, or host this API on the public internet. Any program or script running under the same computer account may still have local access.
- Both the CLI server and the generic API factory require a token by default; automated test fixtures can explicitly use `authToken: null` for compatibility.
- Existing JSON database and backup formats are unchanged.

Earlier V6.0.2 to V6.0.7 documentation describes the security capabilities available **at those versions**. This V6.0.8 section supersedes older statements that the normal CLI server has no token gate.
