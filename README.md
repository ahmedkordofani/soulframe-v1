# SoulFrame

**AI Music Humanization Review Tool**

SoulFrame is a browser-based prototype for reviewing AI-generated music and turning technical observations into clearer human-led production decisions.

The product is built around a simple belief:

> AI can assist the creative process, but the final emotional and musical decisions still need a human ear.

## Live Demo

https://soulframe-v1.vercel.app

## Current Version

**V5.3.0 — Report Sharing & Export**

SoulFrame now supports a cleaner path from AI-music review to producer/client reporting, local report export, browser-native sharing, before/after case-study presentation, and final client delivery preparation.

The current product flow is:

**Dashboard → Analyze → Report → Output → Advanced**

Advanced remains optional so deeper technical and architectural material does not control the first impression of the product.

## What SoulFrame Does

SoulFrame helps producers review AI-generated music and organise the humanization process around practical questions:

- What sounds technically or musically risky?
- What should the producer listen to first?
- What needs a human decision rather than another automated pass?
- How can the findings be explained clearly to a client?
- What should be delivered next?

The current prototype includes browser-safe audio inspection, humanization priorities, smarter report composition, before/after comparison, producer guidance, client-safe reporting, downloadable local reports, delivery preparation, saved local sessions, and backend/API planning scaffolds.

## V5.3 — Report Sharing & Export

### V5.3.1 — Product Workspace Modularization

The Product workspace began moving out of the monolithic `App.jsx` file into dedicated modules.

Key presentation components now live in:

```text
src/product/ProductWorkspace.jsx
```

This creates safer boundaries for future refactoring, report features, and code splitting while preserving the public Product experience.

### V5.3.2 — Clean Report Preview

Introduced a polished report presentation layer with separate:

- Producer view
- Client view
- Executive/client summaries
- Producer priorities
- Before/after explanation
- Recommended next move
- Report quality and output details

The goal is to make SoulFrame output feel closer to something a producer could genuinely review or send.

### V5.3.3 — Downloadable Report Export

Added real browser-local TXT export.

Producer and Client reports generate separate project-based filenames and download without uploading report or audio data to a server.

### V5.3.4 — Shareable Report Direction

Added browser-native text sharing where supported, with clipboard fallback.

SoulFrame also exposes the direction for future hosted report routes:

```text
/report/project-name
```

No fake public cloud URL is generated in V5.3. Secure hosted reports remain part of a later backend phase.

### V5.3.5 — Before / After Case Study

Before/after review can now become a cleaner case-study format showing:

- Humanization Priority before and after
- Brightness
- Texture stability
- Dynamics
- Clipping risk
- What changed
- Client-safe explanation
- Final human-check guidance

The case study can also be copied or downloaded locally.

### V5.3.6 — Client Delivery Experience

The Output workspace now includes a final delivery checkpoint with:

- Delivery readiness
- Producer Brief status
- Client Update status
- Revision Checklist status
- Final human listening checks
- Client message preview
- Delivery note copy/download
- Clear next-step guidance

The final delivery decision remains explicitly human-led.

### V5.3.7 — Report Sharing & Export Handoff

The V5.3 handoff confirms the complete planned feature set and clearly separates current browser-local behaviour from future backend capabilities.

## Product Evolution

### V4.0.0 — Deeper Audio Intelligence

Expanded browser-safe audio analysis and humanization guidance.

### V4.1.0 — Backend/API Prototype Scaffold

Defined early API and backend architecture direction without presenting it as a live backend.

### V4.2.0 — Smarter Humanization Reports

Added smarter report composition, quality gates, output packs, final handoff logic, export manifests, and stronger before/after explanations.

### V5.0.0 — Product UX Simplification

Shifted SoulFrame away from a long technical-document experience toward a clearer product direction.

### V5.1.0 — Real Layout Refactor

Introduced the Dashboard / Analyze / Report / Output / Advanced workspace model.

### V5.2.0 — Visual Polish & Public Beta Presentation

Improved the public-facing hero, value proposition, workflow explanation, guided demo scenarios, screenshot strategy, and presentation readiness.

### V5.3.0 — Report Sharing & Export

Connected the analysis/report system to cleaner producer/client presentation, local downloads, sharing direction, case studies, and final delivery preparation.

## Architecture

Current stack:

- React
- Vite
- Tailwind CSS
- JavaScript
- Web Audio API
- LocalStorage
- GitHub
- Vercel

Current modular areas include:

```text
src/
├── App.jsx
├── product/
│   └── ProductWorkspace.jsx
└── report/
    ├── CleanReportPreview.jsx
    ├── BeforeAfterCaseStudy.jsx
    ├── ClientDeliveryExperience.jsx
    └── ReportSharingExportHandoff.jsx
```

The codebase is still in transition. `App.jsx` remains large and contains substantial legacy builder and workspace logic. V5.3 begins the modularization process rather than claiming it is finished.

## Privacy / Browser-Safe Behaviour

The current audio-review prototype runs locally in the browser.

V5.3 report downloads are also generated locally.

SoulFrame does **not** currently provide:

- user accounts
- cloud project persistence
- live public report URLs
- database-backed report history
- permissions or access control
- revocable shared links
- server-generated PDFs
- a production backend/API

The V4.1 backend work remains architectural/prototype scaffolding only.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

## Current Development Note

The production bundle currently sits around Vite's default large-chunk warning threshold.

This is not blocking the prototype, but future cleanup should continue:

- extracting large UI areas from `App.jsx`
- separating builder/business logic
- introducing route/component-level lazy loading
- reducing repeated planning/prototype UI
- improving code splitting

## Roadmap

### V5.4 — UI Simplification & Codebase Cleanup

Planned direction:

- continue modularizing `App.jsx`
- simplify overlapping V4/V5 panels
- remove redundant prototype/planning surfaces
- improve lazy loading and code splitting
- reduce bundle size
- tighten the public Product, Report, and Output experiences
- preserve Classic Demo and deeper architecture without letting them dominate the main workflow

### V6.0 — Real Backend/API Implementation

Potential future work:

- persistent projects
- authenticated users
- hosted reports
- secure share links
- report permissions
- revocable links
- database persistence
- server-side export/PDF generation
- real API endpoints
- production deployment architecture

These capabilities are not yet implemented.

## Status

SoulFrame remains an evolving prototype and public-beta product experiment.

The focus is not to automate creative judgement. It is to make AI-assisted music review more understandable, more structured, and more useful to the producer who still has to make the final call.
