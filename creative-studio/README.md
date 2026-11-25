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

1. **originals/** — raw ingested footage/photos, untouched, as shot. Two
   subfolders: `originals/iphone/` and `originals/glasses/` — the QC step
   applies a different bar to each (glasses footage has no framing/zoom
   control; that's the format, not a defect). Drop files into whichever
   matches how they were captured.
2. **analyzed/** — originals plus AI-generated understanding (what's in the
   shot, usable clips, quality flags) from the video-understanding step.
3. **projects/** — in-progress edits: draft cuts, selected clips, graphics
   in progress, not yet finished.
4. **finished/** — rendered output, technically complete, pending review.
5. **approved/** — Pau has approved in the dashboard. Nothing moves past
   this stage without that explicit approval (see `brand-rules.md`:
   "Nothing publishes without Pau's approval in the dashboard").
6. **published/** — live on a public channel, with a record of where and
   when.

## Status

Folder structure only, as of 2026-11-24. No storage, video-understanding,
editing, or publishing integration is wired up yet — those require new paid
services and credentials, flagged separately for approval before building.
