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
9. Export producer/client reports, checklists, and project records
10. Save, search, import, and export local project sessions
11. Load demo presets for quick testing, screenshots, and walkthroughs

---

## Current Features

- Project Intake system
- Demo Mode Presets
  - AI Vocal Draft
  - AI Instrumental Draft
  - Client-Ready Review
  - Before / After Humanized Edit
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

**V3.3.0: Client Workflow Power-Up**

SoulFrame V3.3 strengthens the client workflow side of the app.

This version adds dedicated client action plan exports, client-safe report summaries, revision checklist generation, and the ability to save demo presets directly as project sessions.

The goal of V3.3 is to make SoulFrame more useful after analysis:

> Review → Decide → Export → Send → Revise

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

---

## Future Roadmap

- Deeper audio feature extraction
- More advanced AI artifact detection
- Spectral analysis
- Vocal-specific artifact detection
- Instrumental texture analysis
- More detailed humanization scoring
- Exportable PDF reports
- Project dashboard improvements
- Client-ready report templates
- Cloud-based saved sessions

---

## About the Creator

Built by **Ahmed Kordofani**, a London-based music producer, mixing engineer, and creative technologist working at the intersection of music, AI, and human creativity.

Website: https://chordofannie.com  
GitHub: https://github.com/ahmedkordofani  
LinkedIn: https://linkedin.com/in/ahmedkordofani
