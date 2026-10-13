# SoulFrame V5.4 Architecture Review

## Scope

V5.4 is a maintainability and workflow-simplification release for a browser-first prototype. It is not a production SaaS release or a machine-validated artifact-detection engine.

## Boundaries that now exist

| Responsibility | Location | Current status |
| --- | --- | --- |
| Main application and remaining legacy presentation | `src/App.jsx` | Still large; further extraction possible |
| Audio measurement and helper calculations | `src/analysis/audioAnalysis.js` | Separate module; browser APIs used for decoding |
| Humanization report-building helpers | `src/report/reportBuilders.js` | Separate module; uses audio helpers and shared defaults |
| Project template | `src/core/projectDefaults.js` | Shared source of truth |
| Local persistence and backup serialization | `src/session/sessionStorage.js` | Separate module, legacy format preserved |
| Session state and actions | `src/session/useProjectSessions.js` | React hook; LocalStorage-backed |
| Main Product workspace | `src/product/ProductWorkspace.jsx` | Modular shell |
| Report, Output and Advanced UIs | `src/report/`, `src/output/`, `src/advanced/` | Simplified, deeper content retained |
| Classic Demo | `src/demo/ClassicDemo.jsx` | Lazy-loaded |
| Secondary pages | `src/views/SecondaryViews.jsx` | Lazy-loaded |
| Automated QA and CI | `tests/` and `.github/workflows/verify.yml` | Regression tests + production build |

## Dependencies and data flow

1. Browser audio decoding -> `audioAnalysis.js` technical proxies.
2. Project template and review mode -> `reportBuilders.js` producer/client and comparison content.
3. `useProjectSessions.js` -> `sessionStorage.js` -> LocalStorage and backup JSON.
4. `App.jsx` wires the engines to Product, Classic Demo, Report and Output.
5. Vite generates on-demand Classic Demo and Secondary Views chunks, with separate React vendor code.

## Release verification evidence

At the V5.4.9 checkpoint, 19 Node tests and the production build passed locally. GitHub Actions also passed for the V5.4.9 branch commit. The main chunk was about 349 KB minified (70.57 KB gzip) at that checkpoint; the React vendor, Classic Demo and secondary views were separate chunks.

V5.4.10 adds static architecture-boundary tests. **A new `npm run verify` and manual browser acceptance pass are required before publication.**

## Known limitations and risks

1. **Analysis validity:** Brightness, RMS, clipping and texture proxies cannot by themselves prove that a sound is AI-generated or emotionally human. User-facing language should frame them as listening aids. Real-music validation is a future task.
2. **Large app shell:** `App.jsx` still handles significant view wiring, legacy copy and in-app helpers. It is not yet fully modular.
3. **Simulation remains:** Some guided analysis progress, demos and backend/API responses are simulated. Do not describe them as live ML detection or server processing.
4. **Persistence limits:** LocalStorage is per-browser, subject to quota and clearing; backups are user-managed and contain project metadata.
5. **Share and export:** TXT downloads and text sharing are local actions. Future-looking `/report/...` paths are not live hosted URLs.
6. **Test gaps:** Node integration tests use synthetic audio and fake storage. They do not validate musical accuracy, real codecs, browser clipboards, permission models or accessibility.
7. **Release operations:** Validate the deployed Vercel site after merging the release. CI success alone does not prove end-to-end UX.

## Proposed V6 entry criteria

- Gather producer feedback on three or more representative draft-to-delivery workflows.
- Decide what will be stored: only report/project metadata versus audio files, with explicit consent and retention policy.
- Define identity, access and revocation requirements before implementing hosted report links.
- Validate privacy/security and clarify unverified model/proxy claims.
- Select an API persistence scheme and add end-to-end tests for any backend endpoints.
- Keep V5.4 as a rollback point before introducing server-side state.
