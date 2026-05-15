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
3. Review real file metadata, waveform, and basic audio health
4. Identify synthetic or unnatural-sounding elements
5. Map the main revision priorities
6. Compare an original AI draft against a humanized edit
7. Generate clear client-facing update notes
8. Export reports, checklists, and project records

---

## Current Features

- Project Intake system
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
- Technical format notes
- Technical readiness score
- Real audio facts inside reports
- Real audio facts inside client updates
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

**V2.1.0: Project Sessions, Export Tools, and Technical Review Workflow**

SoulFrame V2.1 expands the functional audio intake system with export tools, saved project sessions, technical readiness scoring, project backup import/export, and client delivery checklists.

The deeper SoulFrame review logic is still partly simulated, but the tool now provides a practical working workflow for reviewing, documenting, and preparing AI-generated music drafts for humanization.

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
LinkedIn: https://www.linkedin.com/in/ahmedkordofani