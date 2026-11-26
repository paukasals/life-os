# Lobsteria Creative Studio — Implementation Status

Last updated: 2026-11-24. This file is the source of truth for what's
actually built vs. planned. A new session should read this before doing
anything else in this department — don't re-audit the whole repo from
scratch, continue from here.

## Phase tracker (per the master directive's own 7 phases)

| Phase | Status | Notes |
|---|---|---|
| 1. Discovery & Architecture | ✅ Done | Repo audited, tool landscape researched with sources, architecture decided (see Decisions below) |
| 2. Foundation | 🟡 Partial | Folder structure + brand knowledge wired. Agent/skill specs for the 13 specialized roles not yet drafted. |
| 3. MVP Pipeline | 🟢 Functionally complete, verification-gated | Ingestion + QC + auto-cut (single clip, multicam, retakes) + bilingual captions + music/brand-text/LUT-capable render + final-render QC with one automatic hook retry + content-aware cover frame. See the 2026-11-26 entry below for the full breakdown of what's tested vs. still only syntax-checked. The one remaining real gap: DaVinci itself isn't installed (pending Pau's decision) — the LUT path is built and works mechanically, but needs a real `.cube` file to look like anything beyond the quick-look preset. |

### 2026-11-26: the 8 remaining editing gaps — resolved, with honest verification status

Pau asked for all 8 gaps from the previous audit to be closed. Here's each
one, what was built, and — important — what's actually been run and
verified vs. what's new Gemini-dependent code that's syntax-checked but not
yet exercised live (no GEMINI_API_KEY in this environment):

1. **QC checklist skipped takes/retakes** → fixed (`qcGroupFiles()`), was a
   real bug introduced in the previous commits, not a missing feature.
   **Verified**: scanning/grouping logic tested with synthetic fixtures.
2. **No audio mixing** → `renderMulticamCut` now takes `musicPath` (looped
   via `-stream_loop -1`, mixed at a configurable dB via `amix`) and adds a
   short (30ms) in/out fade on every cut segment's audio to kill clicks
   (chose this over true `acrossfade` — crossfading would shorten total
   duration per cut point and risk A/V desync across many segments; the
   fade approach has zero timing risk). **Verified**: rendered a real music
   bed mixed under a voice tone, confirmed correct output duration and a
   valid (non-silent-stream) audio track.
3. **No branded on-screen text overlays** → `drawtext`-based overlay system
   (`brandTexts: [{text, start, end}]`), separate from dialogue captions,
   cream/white centered text in the safe middle band. **Verified**:
   rendered with real overlay text, confirmed the output frame isn't
   black/broken (font loaded successfully — a bad font path makes ffmpeg
   fail outright, and it didn't).
4. **No opposite-language subtitles** → `translateSegments()` (Gemini)
   translates kept dialogue into the opposite language before burning
   captions, per brand-rules.md's bilingual system. **Not verified live** —
   needs a real Gemini call.
5. **QC never re-checked the rendered output** → `decideAndRender()` now
   runs `analyzeMedia(..., {source: 'rendered'})` on the actual finished
   cut, not just the raw footage, written to `<id>.final-qc.json`.
   **Not verified live.**
6. **Thumbnail was a naive midpoint frame** → `selectCoverFrame()` (Gemini)
   picks the actual best cover moment; falls back to a midpoint frame if
   the call fails for any reason. **Not verified live.**
7. **No platform/fps variants** → `chooseExportFps()` heuristic: a
   silent/no-dialogue clip (matches the B2 "Process Reel" profile) exports
   at 24fps per camera-course-reference.md, anything with spoken dialogue
   stays at 30fps. **Verified**: unit-tested the heuristic logic directly
   with representative segment lists.
8. **No automatic re-cut retry loop** → `decideAndRender()` re-calls the
   same decision function with a `strengthenHook` instruction (reorder/
   open on the strongest moment) when final QC flags a weak hook, capped
   at `MAX_HOOK_RETRIES = 1` so it can't loop forever. **Not verified
   live** — the retry branch itself is straightforward code, but whether
   Gemini's retried decision actually produces a better hook in practice
   is unknown until tested on something real.

Also added, since they were needed to build the above: `COLOR_LUT_PATH` env
var applies a real `.cube` LUT via FFmpeg's `lut3d` filter as a DaVinci-free
path toward the "pro" grade — **verified mechanically** (ran clean with an
identity test LUT) but Pau hasn't supplied a real Lobsteria LUT yet, so
production renders still use the quick-look preset. `MUSIC_BED_PATH` and
`BRAND_FONT_PATH` env vars, same no-op-if-unset pattern.

**Bottom line**: every piece that touches FFmpeg only has been run for
real and checked (duration, resolution, pixel content, non-silent audio).
Every NEW piece that calls Gemini (translation, cover-frame selection, the
retry loop's actual effectiveness) is real code, not a stub, but is
exactly as unverified as the rest of this project's Gemini calls — still
blocked on a real `GEMINI_API_KEY` and real footage (see Blocked On).
| 4. Professional Production | ⬜ Not started | Color grading, audio design, motion graphics — depends on Phase 3 landing first |
| 5. Approval & Distribution | ⬜ Not started | Dashboard not built. Instagram/TikTok publishing confirmed to require app review (see compliance-notes.md) — this is a real multi-week external approval process, not something to build around |
| 6. Commercial Intelligence | ⬜ Not started | Depends on real content existing first |
| 7. Optimization | ⬜ Not started | N/A until there's a running system to optimize |

**Honest assessment:** this is a multi-week+ build for a real production
system with 13+ specialized roles, a mobile dashboard, two external platform
app-review processes, and a learning/attribution loop. It will NOT be fully
built in one session. Work proceeds phase by phase, each verified before
moving on, per the directive's own rule ("no declares una fase completada
hasta verificar sus criterios de aceptación").

## What's actually built and verified

- `src/knowledge/marketing/brand-rules.md` — mandatory brand rules,
  authoritative over conflicting language elsewhere.
- `src/knowledge/marketing/brand-strategy.md` — updated to remove all
  "chef" references, the stale review count, and the paid-Meta-ads
  instruction that conflicted with brand-rules.md.
- `creative-studio/{originals,analyzed,projects,finished,approved,published}/`
  — folder taxonomy. Currently holds structure/metadata only; no object
  storage wired up (see Open Decisions).
- `src/shared/ffmpeg.js` — probe / thumbnail / review-proxy helpers.
  **Verified**: ran end-to-end against a generated test clip (probe
  returned correct duration/resolution/codec, thumbnail and proxy files
  produced correctly).
- `src/shared/gemini.js` — video/photo understanding wrapper using
  `@google/genai` v3.6.1 (`files.upload` → poll `files.get` for `ACTIVE`
  state → `generateContent` with `createPartFromUri`). API shape confirmed
  against the installed SDK's type definitions. **Not yet run live** — no
  `GEMINI_API_KEY` configured, no real call made.
- `src/agents/creative-studio/index.js` — `CreativeStudioAgent`: scans
  `originals/` for new media, probes + analyzes + makes a review proxy for
  each, notifies Pau via Telegram when done. Registered in the orchestrator
  for **manual run only** (`node index.js run creativeStudio`) — not on any
  cron, since it hasn't been validated against real material yet.
- `creative-studio/compliance-notes.md` — Florida recording-consent
  research and Instagram/TikTok publishing API requirements, with sources.

## Decisions made (with reasoning)

- **Gemini over TwelveLabs** for video understanding: not a quality
  trade-off — TwelveLabs is built for searching large existing video
  libraries, Gemini is the right tool for understanding a single new clip,
  which is our actual problem. Cheap (~$0.01-0.03/short video).
- **FFmpeg** for basic processing (trim, thumbnail, proxy, format): no
  quality compromise vs. paid tools for these operations, zero cost.
- **DaVinci Resolve Studio (one-time ~$295) over Shotstack** for final
  edit/render, now that Pau confirmed he's open to running it on his own
  Mac: Resolve's color grading (color correction between iPhone/Meta-glasses
  footage), Fusion (motion graphics), and Fairlight (audio) are a real
  quality tier above Shotstack's templated cloud API. Shotstack stays as a
  fallback for quick automated edits where polish doesn't matter.
  **Not yet installed or integrated** — needs Pau's go-ahead to install
  DaVinci Resolve Studio and the one-time purchase.
- **Remotion** for motion graphics (animated logo, lower-thirds): quality is
  genuinely professional-grade, not a budget compromise. Licensing is the
  open question — building this into an automated pipeline may trigger
  Remotion's "Automators" tier ($0.01/render, $100/mo minimum) rather than
  the free ≤3-person tier. Not confirmed with Remotion directly yet. Do not
  assume free tier applies once this is wired into automation.
- **Adobe Firefly/Lightroom/Photoshop APIs**: held off. No clear specific
  need yet (pricing per "operation" isn't even publicly listed), and
  FFmpeg covers basic processing needs for now.
- **No automated publishing yet**: Instagram and TikTok both require a
  developer-app review process (weeks, needs Pau's business details and
  explicit go-ahead to start) before real automated posting works. Building
  around this with screen-scraping or unofficial automation would violate
  both platforms' Terms — not doing that. MVP output target is finished,
  platform-formatted files ready for manual posting, with automated
  publishing deferred to Phase 5 once the app reviews are underway.

## Blocked on Pau (can't proceed without these)

1. **Gemini API key** — free, from https://aistudio.google.com/apikey.
   Needed to run the analysis step for real.
2. **Real Lobsteria footage/photos** — at least one real clip or photo in
   `creative-studio/originals/` to validate the pipeline end-to-end, per
   the directive's own acceptance criteria (real material, not mocks).
3. **DaVinci Resolve Studio decision** — confirm you want to install it on
   your Mac and make the one-time ~$295 purchase, before the edit/render
   stage gets built around it.
4. **Both training PDFs now received.** The Video Plan (Weeks 1-2, Oct
   12-25) ingested 2026-11-25 into `src/knowledge/marketing/video-plan-oct-2026.md`
   and `creative-studio/video-production-spec.md`. The Camera Course (14
   modules, 31 pages, Pau's own 8-week training curriculum) ingested
   2026-11-25 into `creative-studio/camera-course-reference.md` (technical
   camera/light/sound/editing rules — the QC reference) and
   `creative-studio/shot-cards.md` (full detail per video/story/personal-
   brand card — supersedes the shorter summaries for V1-V10 in
   video-plan-oct-2026.md). Both PDFs are internally consistent with each
   other and with brand-rules.md — no new contradictions found.
   **Superseded 2026-11-25:** both PDFs originally assumed no glasses
   ("not part of this course until you own them"). Pau confirmed he now
   owns Meta Nova glasses (Sandstone/clear, 12MP, 100° FOV, 3K@30fps,
   verified specs in camera-course-reference.md) and wants them as the
   **primary capture device for @paupau.ownerdiary**, with iPhones
   assisting specific videos. Updated camera-course-reference.md and
   shot-cards.md accordingly. Explicit strategic priority set by Pau: reach/
   virality (views, follower growth, becoming a recognized Miami IG/TikTok
   name) is the top KPI across all content — documented in
   camera-course-reference.md rather than treated as a tension with the
   existing authenticity rules (the hook mechanics already in the course
   ARE the viral mechanics; nothing in brand-rules.md needed to change).
   **Notable independent finding:** the course explicitly warns "InVideo AI
   ... must never replace a proper edit" for Pau's own footage (reviewers
   find its manual editing basic/clunky) — this validates the
   CreativeStudioAgent's existing approach (rule-based FFmpeg pipeline, not
   a generic "AI generates the edit" tool) rather than suggesting a change.
5. **Instagram/TikTok developer app review** — starting this requires your
   business details, a privacy policy link, and your explicit authorization
   (it's an external, auditable process tied to your real accounts).
6. **Florida recording-consent confirmation** — recommend an actual
   attorney consult before relying on customer-facing footage from the Meta
   glasses at any commercial volume (see compliance-notes.md). Not blocking
   the MVP (which is Pau's own POV footage, not customers), but blocking
   before scaling customer-facing content.

## Known limitations

- This repo's deploy target (Railway) is not suitable for hosting a video
  asset library or for running DaVinci Resolve (which needs a GUI session,
  can't run headless). Object storage (recommended: Cloudflare R2) is still
  an open decision, not yet built.
- No dashboard exists yet (directive §15). Approval today = Pau looking at
  files directly in `creative-studio/finished/` plus the Telegram
  notification the agent already sends.
- The 13 specialized agent roles (Creative Director, Colorist, Sound
  Designer, etc.) are not yet built as separate agents/skills. Right now
  there's one `CreativeStudioAgent` doing ingestion, analysis, and
  auto-cut.
- **Resolved 2026-11-25** (was a known gap): simultaneous multi-camera
  recordings of the SAME moment (originals/takes/, see README.md) are now
  handled — Gemini watches 2-3 synced sources together and picks the best
  camera per moment.
- **Resolved 2026-11-26** (was the remaining gap): SEPARATE, non-
  simultaneous full retakes of the same video (originals/retakes/) are now
  handled too — `decideBestOfRetakes()` compares complete independent
  attempts on delivery quality and either uses one throughout or
  composites the best delivery of each part across takes. Reuses the exact
  same render engine as multicam (`renderMulticamCut`) since the cutting
  mechanics are identical — only the Gemini decision prompt differs
  between "these are synchronized camera angles" and "these are separate
  attempts recorded at different times." Folder scanning for both group
  types (`takes/` and `retakes/`) shares one `findUnprocessedGroup()`
  helper; verified with synthetic fixtures that both correctly detect
  their groups and file roles.
- Color grade is the FFmpeg "quick-look" preset (contrast/brightness/
  saturation/color-balance/vignette/grain), not the Apple Log + LUT
  pro-stage workflow — that needs either DaVinci or a proper LUT applied
  via FFmpeg, neither built yet.
- No platform-specific export variants yet (the render always outputs one
  file) — acceptable for now since Instagram/TikTok/YouTube Shorts specs
  converge on the same 1080x1920 format per camera-course-reference.md,
  but B2-style videos wanting 24fps export need that passed explicitly
  (the agent currently always renders at 30fps).
