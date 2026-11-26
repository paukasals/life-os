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

See `STATUS.md` for the full, current state. As of 2026-11-26: ingestion,
QC, auto-cut (single clip, multicam, retakes), bilingual captions, a music/
brand-text/LUT-capable render, a final-render QC pass with one automatic
hook retry, and content-aware cover-frame selection are all built. Storage
and publishing integration are still not wired up (need new paid services/
credentials, flagged for approval before building).

## Optional environment variables (all no-ops if unset)

- `CREATIVE_STUDIO_MUSIC_PATH` — a royalty-free background track file. If
  set, it's mixed under the voice/sound at ~-22dB (adjustable in code),
  looped to match the render's length. Nothing plays if unset.
- `CREATIVE_STUDIO_FONT_PATH` — the real Lobsteria brand font (.ttf/.otf)
  for the branded on-screen text system. **Defaults to
  `creative-studio/fonts/AlfaSlabOne-Regular.ttf`** — Alfa Slab One, a
  free, OFL-licensed Google Font: a heavy slab serif that reads as a
  serious vintage nautical badge/stamp, not a comic/meme face. Chosen over
  the comic-style font Pau flagged from a reference account because that
  one relied on a colored stroke effect rather than the typeface itself,
  and didn't fit the brand tone. Set this var to a different font file to
  use another one, or to the literal string `"none"` to disable it and
  fall back to the system font (DejaVu Sans Bold) — fine for testing, not
  the real brand look.
- `CREATIVE_STUDIO_LUT_PATH` — a real `.cube` 3D LUT for the "pro" color
  grade (camera-course-reference.md's Apple Log 2 + LUT look), applied via
  FFmpeg instead of needing DaVinci. **Defaults to
  `creative-studio/luts/lobsteria-warm.cube`** — a LUT built from scratch
  for this project (see `creative-studio/tools/generate-lobsteria-lut.mjs`)
  implementing warm highlights, teal-leaning shadows, and -7% saturation,
  so the pro grade is on by default with no setup needed. Set this var to
  a different `.cube` path to use another LUT, or to the literal string
  `"none"` to disable LUT grading and fall back to the plain FFmpeg preset.
