# SoulFrame

**AI Music Humanization Review Tool**

SoulFrame is an experimental, browser-first tool for music producers reviewing AI-generated drafts. It turns basic audio measurements and review notes into human-led revision priorities, before/after comparisons, producer reports, and client communication.

**Principle:** AI can assist the creative process, but the final emotional and musical decisions still need a human ear.

## Live Demo

https://soulframe-v1.vercel.app

## Current Version

**V6.0.3 - Local Project API Integration (development)**

V5.4.0 is published. V6.0.3 adds user-controlled Save, Load, Overwrite and Delete actions for the local project API built in V6.0.2. Browser projects are **not** automatically synced; no audio is uploaded. See [V6 project UI integration](docs/v6-project-ui-integration.md).

V5.4 focuses on making the existing prototype easier to navigate, maintain and test. It does not add cloud services or claim to solve AI-artifact recognition.

The Product flow remains: **Dashboard -> Analyze -> Report -> Output -> Advanced**.

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

tests/
  reportBuilders.test.mjs
  sessionStorage.test.mjs
  integration.test.mjs
  architecture.test.mjs

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

The same verification runs in GitHub Actions on pushes to `main` and `v5-*` branches, and on pull requests. Browser acceptance testing remains necessary; see [docs/quality-checklist.md](docs/quality-checklist.md).

## Privacy and Prototype Limitations

Audio inspection and current report generation operate in the browser, with no required audio upload backend. Project/session data is stored in the browser and may be lost if local site data is cleared. Export a backup before clearing site data or testing migration.

SoulFrame does **not** yet provide authenticated accounts, persistent cloud projects, secure hosted report links, revocable sharing permissions, database-backed history, server PDFs, or a production API. The V4.1 API work is a prototype scaffold only.

## Next Chapter

**V6 - Backend and Real-World Validation (proposed)**

Before designing cloud persistence or user accounts, validate the producer workflow with representative tracks and real feedback. Scope authentication, storage, report sharing, consent and audio/privacy handling deliberately. See [docs/architecture-v5.4.md](docs/architecture-v5.4.md) for remaining risks.

## Release History

- V4.0.0 - Deeper Audio Intelligence
- V4.1.0 - Backend/API Prototype Scaffold
- V4.2.0 - Smarter Humanization Reports
- V5.0.0 - Product UX Simplification
- V5.1.0 - Real Layout Refactor
- V5.2.0 - Visual Polish and Public Beta Presentation
- V5.3.0 - Report Sharing and Export
- V5.4.0 - UI Simplification and Codebase Cleanup (published)


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
