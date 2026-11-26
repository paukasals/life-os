# Lobsteria Creative Studio

Audiovisual pipeline for Lobsteria content: founder POV/prep footage, menu
photography, social video. Reuses the existing life-os agent/orchestrator
pattern (`src/shared/base-agent.js`, `src/orchestrator`) and the marketing
knowledge base (`src/knowledge/marketing/`), especially `brand-rules.md`,
which every stage of this pipeline must respect.

## Important: this folder holds structure and metadata, not raw video

Git repos are the wrong place for actual video/photo binaries — size limits,
no diffing, bloats every clone. These six folders are the **pipeline stage
taxonomy** and will hold metadata (JSON/markdown describing each asset, its
stage, analysis results, approval status) once real storage is wired up.
The binary files themselves belong in object storage (not yet configured —
see the open decisions below).

## Pipeline stages

1. **originals/** — raw ingested footage/photos, untouched, as shot.
   - `originals/iphone/` and `originals/glasses/` — single-camera clips.
     The QC step applies a different bar to each (glasses footage has no
     framing/zoom control; that's the format, not a defect).
   - `originals/takes/<take-id>/` — **2-3 simultaneous recordings of the
     same moment** (e.g. Cam A on the Osmo + Cam B on the tripod, sometimes
     + Meta Nova glasses POV). Name each file by role: `camA.mp4`,
     `camB.mp4`, `glasses.mp4` (role = whatever's before the first `.` or
     `_` in the filename, so `camB_take2.mov` also works). The pipeline
     watches all files in a take together and decides which camera to show
     for each moment — it does not need numeric sync, it matches the
     content semantically (same words/action across cameras).
   - `originals/retakes/<video-id>/` — **separate, non-simultaneous full
     attempts** at the same intended video (e.g. Pau records all of V2,
     isn't happy, records the whole thing again later as its own file).
     Different from `takes/`: these happen at different times and can't be
     cut between at a shared timestamp. Name each file `take1.mp4`,
     `take2.mp4`, etc. The pipeline compares the full takes on delivery and
     either uses one throughout (if one is simply best) or composites the
     best delivery of each part across takes.
   - Both group types need **at least 2 files** to use their path; a
     single file in its own group folder gets skipped with a note to move
     it to iphone/ or glasses/ instead.
2. **analyzed/** — originals plus AI-generated understanding (what's in the
   shot, usable clips, quality flags) from the video-understanding step.
3. **projects/** — in-progress edits: draft cuts, selected clips, graphics
   in progress, not yet finished.
4. **finished/** — rendered output, technically complete, pending review.
   For video: `<name>.cut.mp4` (auto-cut, graded, captioned render),
   `<name>.srt` (captions), `<name>.transcript.json` (the full keep/cut
   decision record, for debugging why something got cut).
5. **approved/** — Pau has approved in the dashboard. Nothing moves past
   this stage without that explicit approval (see `brand-rules.md`:
   "Nothing publishes without Pau's approval in the dashboard").
6. **published/** — live on a public channel, with a record of where and
   when.

## Status

Folder structure only, as of 2026-11-24. No storage, video-understanding,
editing, or publishing integration is wired up yet — those require new paid
services and credentials, flagged separately for approval before building.
