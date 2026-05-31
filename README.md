# SoulFrame

**AI Music Humanization Review Tool**

SoulFrame is a creative technology tool designed to help producers review AI-generated music drafts, inspect audio files, identify synthetic artifacts, compare humanized edits, and prepare clearer client update notes.

The goal is simple:

> Help AI-generated music feel more human, emotional, and intentional.

---

## Live Demo

https://soulframe-v1.vercel.app

---

## What SoulFrame Does

SoulFrame is built around a practical AI-humanization workflow:

1. Upload an AI-generated music draft
2. Preview and inspect the audio
3. Review real file metadata, waveform, and audio health
4. Identify synthetic or unnatural-sounding elements
5. Generate early artifact clues from browser-based proxy analysis
6. Map the main revision priorities
7. Compare an original AI draft against a humanized edit
8. Generate clear client-facing update notes
9. Export producer/client reports, checklists, product summaries, and project records
10. Save, search, import, and export local project sessions
11. Load demo presets for quick testing, screenshots, and walkthroughs
12. Explain the product through About, Walkthrough, and How It Works views
13. Guide first-time visitors with a Quick Start path
14. Launch different demo scenarios without manual setup
15. Show public demo status, use cases, release notes, roadmap direction, and local-session privacy notes
16. Provide share links and footer links to the live demo, GitHub, and ChordOfAnnie
17. Use V4 audio intelligence to turn browser-based analysis into producer priorities, humanization confidence, revision moves, client-safe summaries, and final recommendations

---

## Current Features

- Project Intake system
- Quick Start Guide
- Demo Launcher Presets
  - Vocal Demo
  - Instrumental Demo
  - Before / After Demo
  - Walkthrough
- Demo Readiness Banner
- Public Demo Notice
- Demo Use Cases panel
- Public Launch Checklist
- Public Demo Stats
- V3.5 Release Notes panel
- Roadmap Preview panel
- Share SoulFrame panel
  - Live Demo
  - GitHub Repository
  - ChordOfAnnie
- Copy public share links
- Download public share links as `.txt`
- Header version badge
- Public Footer Links
  - Live Demo
  - GitHub
  - ChordOfAnnie
  - About SoulFrame
- Neutral public demo naming
- Improved saved project empty state
- Import backup available before saving projects
- Disabled Clear All state when no projects are saved
- Demo Mode Presets
  - AI Vocal Draft
  - AI Instrumental Draft
  - Client-Ready Review
  - Before / After Humanized Edit
- About / Product Story panel
- Demo Walkthrough mode
- How SoulFrame Works section
- Copy Product Summary
- Download Product Summary
- Draft Review mode
- Before / After Review mode
- Audio upload and playback
- Real file metadata
- Duration reading
- Waveform preview
- Basic audio health check
  - Peak level
  - Clipping risk
  - Average energy
  - Dynamics estimate
  - Sample rate
  - Channel count
- Spectral texture proxy analysis
- Brightness profile detection
  - Dark / Warm
  - Balanced
  - Bright / Potentially Harsh
- Texture stability detection
  - Stable
  - Moderate Movement
  - Unstable / Busy
- Early artifact clues
  - Possible harsh AI shimmer
  - Possible generated texture movement
  - Possible flat emotional movement
  - Headroom may affect perception
- Producer Listening Focus
- Humanization Priority Score
- Priority labels
  - Low Priority
  - Medium Priority
  - High Priority
- Section-by-section review notes
  - Intro
  - Verse
  - Chorus
  - Bridge / Breakdown
  - Outro
- Humanization Action Plan
- Producer Notes / Client-Safe Notes toggle
- Before / After Humanization Delta
- Session Summary Card
- Copy Session Summary
- Error Boundary / blank screen protection
- Producer Report / Client Report export modes
- Client-friendly report wording
- Technical format notes
- Technical readiness score
- Real audio facts inside reports
- Real audio facts inside client updates
- Artifact clues inside client updates
- Artifact clues inside exported reports
- Before / After audio comparison summary
- Before / After technical improvement score
- Client delivery checklist
- Project Snapshot
- Project Workflow
- Revision History
- Next Revision Plan
- Artifact Database
- Client Update Generator
- Copy Full Report
- Download Full Report as `.txt`
- Copy Client Update
- Download Client Update as `.txt`
- Copy Delivery Checklist
- Download Delivery Checklist as `.txt`
- Local project session saving
- Multiple saved project sessions
- Searchable saved project history
- Saved project backup export
- Saved project backup import
- Reset Session button
- Internal self-tests for core logic
- V4 Audio Intelligence Baseline
- Frequency Balance Insight
- Low / Mid / High energy estimate
- Harshness Risk
- Mud Risk
- Thinness Risk
- AI Texture Risk
- Producer Interpretation Summary
- V4 Listening Priority Stack
- V4 Revision Move Suggestions
- V4 Humanization Confidence Score
- V4 Client-Safe Summary
- V4 Readiness Checklist
- V4 Next-Pass Brief
- V4 Producer Decision Log
- V4 Human Touchpoints
- V4 Client Update Draft
- V4 Review Snapshot
- V4 Final Recommendation
- V4 Analysis Stack Overview
- V4 Executive Summary
- V4 Export Completeness Checklist

---

## Tech Stack

- React
- Vite
- Tailwind CSS
- JavaScript
- Web Audio API
- LocalStorage
- GitHub
- Vercel

---

## Why This Exists

AI-generated music can be fast and impressive, but it often lacks the subtle details that make music feel alive.

SoulFrame explores how producers can use AI as a tool without removing the human ear, emotional judgement, and creative decision-making from the process.

The tool is designed around the belief that AI can assist creativity, but the final emotional, musical, and human decisions still need a producer.

This project is part of my wider work as **ChordOfAnnie**, focused on humanizing AI-generated sound and bringing soul back into music.

---

## Current Version

**V4.0.0: Deeper Audio Intelligence**

SoulFrame V4.0 introduces a deeper audio intelligence layer for reviewing AI-generated music drafts.

This release builds on the V3.5 public demo foundation and adds producer-facing analysis, decision support, humanization confidence, revision planning, client-safe summaries, and final recommendation logic.

The goal of V4.0 is to make SoulFrame more than a demo: it becomes a practical review assistant for producers working with AI-generated music.

---

## V3 Features

- Spectral texture proxy analysis
- Brightness profile detection
  - Dark / Warm
  - Balanced
  - Bright / Potentially Harsh
- Texture stability detection
  - Stable
  - Moderate Movement
  - Unstable / Busy
- Early artifact clues
  - Possible harsh AI shimmer
  - Possible generated texture movement
  - Possible flat emotional movement
  - Headroom may affect perception
- Artifact clues included in client updates
- Artifact clues included in exported reports
- Producer Listening Focus
- Humanization Priority Score
- Priority labels
  - Low Priority
  - Medium Priority
  - High Priority
- Section-by-section review notes
  - Intro
  - Verse
  - Chorus
  - Bridge / Breakdown
  - Outro
- Producer-focused prompts for emotional realism, arrangement movement, and sonic intention

---

## V3.1 Features

- Humanization Action Plan
- Practical production moves based on SoulFrame review results
- Before / After Humanization Delta
- Producer Notes / Client-Safe Notes toggle
- Client-safe action plan wording
- Session Summary Card
- Session summary included in full report exports

---

## V3.2 Features

- Error Boundary / blank screen protection
- Recovery fallback if a review panel crashes
- Producer Report / Client Report export modes
- Client-friendly report wording
- Copy Session Summary
- Demo Mode Presets
- Preset scenarios for:
  - AI Vocal Draft
  - AI Instrumental Draft
  - Client-Ready Review
  - Before / After Humanized Edit

---

## V3.3 Features

- Export Client Action Plan
- Copy Client Plan
- Download Client Plan
- Copy Client-Safe Report Summary
- Revision Checklist Generator
- Copy Revision Checklist
- Download Revision Checklist
- Save Demo Preset as Project
- Client workflow support for review output, revision planning, and client communication

---

## V3.4 Features

- About / Product Story panel
- Demo Walkthrough mode
- Export Product Summary
- Copy Product Summary
- Download Product Summary
- How SoulFrame Works section
- Clearer in-app explanation of the SoulFrame workflow
- Improved product presentation, demo readiness, and project storytelling

---

## V3.5 Features

- Quick Start Guide for first-time visitors
- Demo Launcher Presets
  - Vocal Demo
  - Instrumental Demo
  - Before / After Demo
  - Walkthrough
- Demo Readiness Banner
- Public Footer Links
  - Live Demo
  - GitHub
  - ChordOfAnnie
  - About SoulFrame
- Saved Project Sessions visible even when no projects are saved
- Import Backup available before any project has been saved
- Disabled Clear All button when there are no saved projects
- Improved empty-state guidance for public demo visitors
- Improved public demo polish, navigation, and first-time user experience

---

## V3.5.1 Features

- Public Demo Notice explaining that SoulFrame is a prototype and human-led workflow
- Demo Use Cases panel
  - Freelance producer workflow
  - AI vocal humanization
  - Instrumental texture cleanup
  - Before / after review
- Public Launch Checklist
- Public Demo Stats
- V3.5 Release Notes inside the app
- Roadmap Preview panel
  - V4.0 Deeper Audio Intelligence
  - V4.1 Backend/API Prototype
  - V4.2 Smarter Reports
  - V5.0 Public Beta Direction
- Share SoulFrame panel
  - Live Demo
  - GitHub Repository
  - ChordOfAnnie
- Copy public share links
- Download public share links as `.txt`
- Header version badge
- Updated product summary wording from V3.4 to V3.5 public demo polish
- Updated saved backup version metadata to V3.5
- Neutralized public demo/client naming
- Preserved existing public footer structure
- Improved public demo clarity without adding unnecessary layout bloat

---

## V4.0 Features

- V4 Audio Intelligence Baseline
  - Frequency balance insight
  - Low / Mid / High energy estimate
  - Harshness risk
  - Mud risk
  - Thinness risk
  - AI texture risk
  - Producer interpretation summary
- V4 Listening Priority Stack
  - Ranks the main listening risks so the producer knows what to check first
- V4 Revision Move Suggestions
  - Turns analysis into practical next-pass moves
- V4 Humanization Confidence Score
  - Estimates how ready the draft feels for human-led refinement
- V4 Client-Safe Summary
  - Converts technical findings into clearer client-facing language
- V4 Readiness Checklist
  - Checks top-end comfort, low-mid clarity, body/warmth, generated texture control, and humanization confidence
- V4 Next-Pass Brief
  - Creates a focused producer plan for the next human edit
- V4 Producer Decision Log
  - Explains why the next edit should move in a specific direction
- V4 Human Touchpoints
  - Reconnects the analysis to emotion, movement, tone, and client delivery
- V4 Client Update Draft
  - Generates ready-to-send language for the next revision update
- V4 Review Snapshot
  - Condenses the whole V4 analysis into one quick overview
- V4 Final Recommendation
  - Suggests whether to proceed to final polish, do one focused humanization pass, or treat the draft as a high-priority revision
- V4 Analysis Stack Overview
  - Shows what SoulFrame checked before making the recommendation
- V4 Executive Summary
  - Summarizes the full V4 review in a clean producer-facing overview
- V4 Export Completeness Checklist
  - Confirms which V4 sections are included in the full report export
- V4 sections added into full report exports
- Improved SoulFrame from a public prototype into a deeper producer decision-support workflow

---

## Version History

### V1.0.0 — Workflow Prototype

- Defined the original SoulFrame interface
- Added draft review workflow
- Added before/after review workflow
- Added artifact database
- Added simulated reports
- Added client update generator

### V2.0.0 — Functional Audio Intake

- Added audio upload and playback
- Added real metadata reading
- Added duration detection
- Added waveform preview
- Added peak/clipping/dynamics health check
- Added real audio facts inside reports
- Added real audio facts inside client updates
- Added before/after audio comparison summary
- Added copy full report button
- Added local project session saving

### V2.1.0 — Project Sessions and Export Workflow

- Added downloadable full reports
- Added client update export
- Added delivery checklist export
- Added saved project sessions
- Added searchable project history
- Added project backup export/import
- Added technical format notes
- Added technical readiness score
- Added before/after technical improvement score
- Added delivery checklist inside report export

### V3.0.0 — Deeper Listening and Humanization Intelligence

- Added spectral texture proxy analysis
- Added brightness profile detection
- Added texture stability detection
- Added early artifact clues
- Added artifact clue sentences inside client updates
- Added artifact clues to exported full reports
- Added producer listening focus
- Added humanization priority score
- Added priority labels and producer notes
- Added section-by-section review notes
- Added section notes to full report exports
- Expanded SoulFrame from technical review into early humanization intelligence

### V3.1.0 — Humanization Guidance and Session Intelligence

- Added Humanization Action Plan
- Added practical production moves based on analysis results
- Added Before / After Humanization Delta
- Added comparison of humanization priority, technical readiness, brightness, texture stability, headroom, and dynamics
- Added Producer Notes / Client-Safe Notes toggle
- Added client-safe wording for sharing humanization plans with clients
- Added Session Summary Card
- Added session summary to full report exports
- Improved SoulFrame’s workflow from analysis-only into analysis plus guided production decisions

### V3.2.0 — Polish, Reliability, and Demo Readiness

- Added Error Boundary / blank screen protection
- Added recovery fallback if a review panel crashes
- Added Producer Report / Client Report export modes
- Added client-friendly report wording
- Added Copy Session Summary
- Added Demo Mode Presets
- Added preset scenarios for AI Vocal Draft, AI Instrumental Draft, Client-Ready Review, and Before / After Humanized Edit
- Improved product stability, demo flow, and presentation readiness

### V3.3.0 — Client Workflow Power-Up

- Added Export Client Action Plan
- Added Copy Client Plan and Download Client Plan
- Added Copy Client-Safe Report Summary
- Added Revision Checklist Generator
- Added Copy Revision Checklist and Download Revision Checklist
- Added Save Demo Preset as Project
- Improved client workflow from review output to revision planning and client communication

### V3.4.0 — Demo, Presentation, and Productization

- Added About / Product Story panel
- Added Demo Walkthrough mode
- Added Export Product Summary
- Added How SoulFrame Works section
- Added clearer in-app explanation of the SoulFrame workflow
- Improved product presentation, demo readiness, and project storytelling

### V3.5.0 — Public Demo Polish

- Added Quick Start Guide for first-time visitors
- Added Demo Launcher Presets for vocal, instrumental, before/after, and walkthrough paths
- Added Demo Readiness Banner
- Added Public Footer Links for Live Demo, GitHub, ChordOfAnnie, and About SoulFrame
- Improved Saved Project Sessions empty state
- Made Import Backup available before saving any projects
- Disabled Clear All when there are no saved projects
- Improved public demo navigation, onboarding, and first-time visitor clarity

### V3.5.1 — Public Demo Stability Cleanup

- Added Public Demo Notice
- Added Demo Use Cases panel
- Added Public Launch Checklist
- Added Public Demo Stats
- Added V3.5 Release Notes inside the app
- Added Roadmap Preview panel
- Added Share SoulFrame panel with public links
- Added copy/download support for public share links
- Added header version badge
- Updated outdated V3.4 product copy to V3.5 public demo wording
- Updated saved backup version metadata
- Neutralized demo/client naming for public repository safety
- Preserved the existing public footer and avoided duplicate footer changes
- Improved public demo clarity, stability, and share-readiness

### V4.0.0 — Deeper Audio Intelligence

- Added V4 Audio Intelligence Baseline
- Added Frequency Balance Insight
- Added Low / Mid / High energy estimate
- Added Harshness Risk, Mud Risk, Thinness Risk, and AI Texture Risk
- Added Producer Interpretation Summary
- Added V4 Listening Priority Stack
- Added V4 Revision Move Suggestions
- Added V4 Humanization Confidence Score
- Added V4 Client-Safe Summary
- Added V4 Readiness Checklist
- Added V4 Next-Pass Brief
- Added V4 Producer Decision Log
- Added V4 Human Touchpoints
- Added V4 Client Update Draft
- Added V4 Review Snapshot
- Added V4 Final Recommendation
- Added V4 Analysis Stack Overview
- Added V4 Executive Summary
- Added V4 Export Completeness Checklist
- Added V4 sections to full report exports
- Improved SoulFrame from public prototype into deeper producer decision-support workflow

---

## Future Roadmap

### V4.1 — Backend/API Prototype

- Backend API integration for deeper analysis
- More scalable project structure
- Stored analysis results
- Optional AI-assisted report logic
- Improved file-processing pipeline

### V4.2 — Smarter Humanization Reports

- Genre-aware recommendations
- Vocal vs instrumental report paths
- Client tone selector
- Suggested edit order
- Revision difficulty estimates
- Clearer before/after explanation

### V5.0 — Public Beta Direction

- Shareable report links
- Exportable PDF reports
- User accounts
- Cloud-based saved sessions
- Upload history
- Stronger branding polish
- Pricing or waitlist direction
- Case studies and public examples

---

## Public Demo Notes

SoulFrame is currently a public prototype.

- Audio inspection runs in the browser
- Saved project sessions use LocalStorage
- Demo presets are included for quick testing
- No private client audio is included in the public repository
- The tool supports producer judgement rather than replacing it
- V4 analysis is a decision-support layer, not an automatic final verdict

SoulFrame is designed as a human-led workflow for making AI-generated music feel more intentional, emotional, and alive.

---

## About the Creator

Built by **Ahmed Kordofani**, a London-based music producer, mixing engineer, and creative technologist working at the intersection of music, AI, and human creativity.

Ahmed creates under the name **ChordOfAnnie**, with a focus on music production, mixing, AI music humanization, and preserving soul in the creative process.

Website: https://chordofannie.com  
GitHub: https://github.com/ahmedkordofani  
LinkedIn: https://linkedin.com/in/ahmedkordofani