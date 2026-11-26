# Lobsteria Creative Studio — Implementation Status

Last updated: 2026-11-26. This file is the source of truth for what's
actually built vs. planned. A new session should read this before doing
anything else in this department — don't re-audit the whole repo from
scratch, continue from here.

## Phase tracker (per the master directive's own 7 phases)

| Phase | Status | Notes |
|---|---|---|
| 1. Discovery & Architecture | ✅ Done | Repo audited, tool landscape researched with sources, architecture decided (see Decisions below) |
| 2. Foundation | 🟡 Partial | Folder structure + brand knowledge wired. Agent/skill specs for the 13 specialized roles not yet drafted. |
| 3. MVP Pipeline | 🟢 Functionally complete, verification-gated | Ingestion + QC + auto-cut (single clip, multicam, retakes) + bilingual captions + music/brand-text/LUT-capable render + final-render QC with one automatic hook retry + content-aware cover frame. See the 2026-11-26 entries below for the full breakdown of what's tested vs. still only syntax-checked. Color grade is now resolved: Pau chose the LUT path over installing DaVinci — see "LUT chosen and generated" below. |

### 2026-11-26: LUT chosen and generated (no DaVinci needed)

Pau asked for the best free LUT. Couldn't download one: this environment's
network policy blocks the free-LUT sites found via research (freevisuals.net
and similar returned a 403 at the proxy level — not fixable from here).
Rather than leave it blocked, generated a real LUT from scratch:
`creative-studio/tools/generate-lobsteria-lut.mjs` produces
`creative-studio/luts/lobsteria-warm.cube` (17×17×17, committed to the
repo), implementing exactly the documented "warm amber, food brightest"
recipe — warm highlights, teal-leaning shadows, mild contrast, -7%
saturation — rather than a generic downloaded preset of uncertain license.

**Verified for real**, not just "ran without erroring": rendered the same
test clip graded and ungraded, and tested pure color swatches through the
LUT directly. A mid-gray swatch came back R=138/G=129/B=120 — a clear,
intentional warm shift (confirms the highlight-warming direction). The
shadow-teal effect is real in the math but subtle enough that it's lost in
8-bit quantization on a pure-black test swatch — a tuning observation, not
a bug (the lift values are deliberately small; could be increased if Pau
wants the teal shadows more pronounced after seeing it on real footage).

This LUT is now the **default** (`COLOR_LUT_PATH` in the agent) — no env
var needs to be set for the pro grade to apply. Set
`CREATIVE_STUDIO_LUT_PATH=none` to fall back to the plain preset, or point
it at a different `.cube` file to use something else later.

### 2026-11-26: brand font chosen and installed (Bevan)

Pau showed a reference account (@kinojerez) using a bold comic/meme-style
font and asked if it fit Lobsteria's branding. Flagged that what stood out
there was mostly a colored stroke/outline *effect*, not the typeface
itself, and that a comic face doesn't match the "vintage nautical badge"
look the course/plan already specify. Pau confirmed ("SI") wanting free
alternatives instead.

Went through several rounds — Pau rejected each batch, so rather than keep
guessing, compared 18 free Google Fonts in total across four screenshots
(Alfa Slab One, Bevan, Graduate, Staatliches, Rokkitt, Arvo, Vidaloka,
Crete Round, Cinzel, Stint Ultra Condensed, Nova Cut, Average, Marcellus,
Black Ops One, Six Caps, Abril Fatface, Playfair Display, Special Elite,
Rammetto One), then gave an honest ranked recommendation tested at
realistic sizes — both a large logo lockup AND small burned-in-caption
size, since most viewers watch muted and captions matter more than the
logo for actual watch time.

Pau picked **Bevan** (Google Fonts, OFL licensed — free for commercial
use, no attribution required) for everything — logo and captions both.
It's a warm, rounded slab serif: vintage without reading as a military
badge (Cinzel/Black Ops One), a comic face (the original reference), or a
stiff formal serif (Playfair/Vidaloka) — and unlike Graduate (an earlier
favorite), its lowercase stays real lowercase rather than auto-converting
to small caps, which matters for long captions reading naturally.
Downloaded the real file from Google's font CDN (`fonts.gstatic.com`,
verified reachable), confirmed it's a valid TrueType font, and committed
it to `creative-studio/fonts/Bevan-Regular.ttf` (replacing the earlier
Alfa Slab One file, which was removed).

**Verified for real**: rendered an actual test clip through the full
render pipeline (`renderMulticamCut`, with the "quick-look" grade +
vignette + brand-text overlay all active, not just a bare `drawtext`
test) and viewed the output frame directly — "LOBSTERIA" renders in bold
white Bevan in its real lower-third position.

This font is now the **default** (`BRAND_FONT_PATH` in the agent) — no
env var needs to be set for branded on-screen text to use the real brand
look. Set `CREATIVE_STUDIO_FONT_PATH=none` to fall back to the plain
system font (DejaVu Sans Bold), or point it at a different font file to
use something else later.

### 2026-11-26: scope simplified — dropped the no-Pau-present automation

Pau asked, pointedly: if this is going to be driven from a Claude Desktop/
Code session rather than run unattended, what are Phases 5-7 (dashboard,
auto-publish, commercial intelligence, optimization) actually for? Fair
question — the original 7-phase plan assumed an autonomous architecture
(a cron job watches a folder, processes footage with nobody present,
notifies Pau, auto-publishes once approved). That's not how Pau intends
to use this.

Rather than keep carrying that scope forward, cut it: no dashboard (Pau
reviewing output live in a Claude conversation already IS the approval
step), no autonomous publish loop (Pau saying "sube esto a Buffer" in that
same conversation already IS the publish step), no standing "commercial
intelligence" system (Pau can ask Claude to pull and analyze Buffer
insights whenever he wants, on demand — see below — rather than needing
an automated learning loop). Phase 4 (motion graphics) stays, but as
something built case-by-case when asked, not as a standing system.

### 2026-11-26: publishing pipeline connected (Buffer + Cloudflare R2)

Investigated (with real research, not assumptions) whether automated
publishing was even possible without the Instagram/TikTok developer-app
review flagged as a blocker. Found that Buffer already has its own
approved Meta/TikTok integration, and — better than hand-building a
Buffer API wrapper by guessing at field names — Buffer has an **official
MCP server** for Claude (`https://mcp.buffer.com/mcp`, discoverable from
Buffer's own Settings → API → Connect an Agent page). Added it to this
project (`claude mcp add --transport http buffer https://mcp.buffer.com/mcp`,
Pau authorized), Pau signed in via `/mcp` in a new session.

**Verified for real**: called `get_account` and `list_channels` live —
confirmed connected to Pau's real Buffer account (pau.kasals@gmail.com)
with 3 real channels: lobsteriamia (TikTok), Lobsteria (Facebook page),
lobsteriamia (Instagram business). Going forward, publishing a finished
video is just asking Claude to do it in a session — no custom publish
code needed in this repo at all.

Buffer's API needs a public URL for video files (no direct upload), so
also built `src/shared/storage.js` (`uploadToR2`) using Cloudflare R2
(S3-compatible, free tier, zero egress fees — `@aws-sdk/client-s3`
added as a dependency, no new vulnerabilities introduced per `npm audit`).
Pau created the Cloudflare account and the `lobsteria-creative-studio`
bucket, enabled its Public Development URL, and generated an Account API
token. Credentials stored in `.env` (gitignored, confirmed) and added to
Railway's production variables (Pau confirmed 2026-11-26), same as
`GEMINI_API_KEY` was. **Not verified against the Railway runtime
itself** — no access to that deployment from here to test; the first
real exercise of it in production will be whenever the agent actually
needs to publish a finished video there.

**Verified for real, full chain**: uploaded a real test file to the real
bucket via `uploadToR2()`, Pau opened the returned public URL
(`https://pub-....r2.dev/...`) in his own browser (this sandbox's network
policy blocks `*.r2.dev`, so Pau confirmed it, not me) — content came back
correctly. Test file deleted afterward. Local file → R2 → public URL →
(next: Buffer) works end to end.

**Not yet tested**: actually calling Buffer's `create_post` with a real
R2-hosted video URL — needs a real finished video, which needs real
footage (still Pau's own "when I start filming").

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
- ~~DaVinci Resolve Studio over Shotstack~~ **Superseded 2026-11-26**: Pau
  chose the free FFmpeg-LUT path instead of installing/paying for DaVinci
  — see "LUT chosen and generated". Shotstack was never actually needed
  either; FFmpeg covers the render.
- **Remotion** for motion graphics (animated logo, lower-thirds): quality is
  genuinely professional-grade, not a budget compromise. Licensing is the
  open question — building this into an automated pipeline may trigger
  Remotion's "Automators" tier ($0.01/render, $100/mo minimum) rather than
  the free ≤3-person tier. Not confirmed with Remotion directly yet. Do not
  assume free tier applies once this is wired into automation.
- **Adobe Firefly/Lightroom/Photoshop APIs**: held off. No clear specific
  need yet (pricing per "operation" isn't even publicly listed), and
  FFmpeg covers basic processing needs for now.
- ~~No automated publishing yet~~ **Superseded 2026-11-26**: solved via
  Buffer's own MCP server, not a direct Meta/TikTok developer-app
  integration — no app review needed. See "Publishing pipeline connected".
- **The 13 specialized agent roles are not being built.** Pau asked
  directly what problem one unified `CreativeStudioAgent` actually causes
  — answer: none, for how this is actually used (Pau driving it from a
  Claude session, not a multi-person studio with separate staff per
  stage). Splitting into 13 roles would only pay off if a human or a
  differently-tuned model needed to own one stage independently. Decision:
  keep the single agent; don't build the split unless a concrete need for
  it shows up later.

## Blocked on Pau (can't proceed without these)

1. ~~Gemini API key~~ **Resolved 2026-11-25**: configured in local `.env`
   and verified live with a real API call
   (`curl -H "x-goog-api-key: ..." .../v1beta/models` → HTTP 200).
2. **Real Lobsteria footage/photos** — at least one real clip or photo in
   `creative-studio/originals/` to validate the pipeline end-to-end, per
   the directive's own acceptance criteria (real material, not mocks).
3. ~~DaVinci Resolve Studio decision~~ **Resolved 2026-11-26**: Pau chose
   the free LUT path instead of installing DaVinci. See "LUT chosen and
   generated" above.
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
5. ~~Instagram/TikTok developer app review~~ **Resolved 2026-11-26**: not
   needed. Publishing goes through Buffer (connected via Buffer's own MCP
   server, see "Publishing pipeline connected" below), which already has
   its own approved Meta/TikTok integration — no separate developer-app
   review required unless we bypass Buffer later, which there's no reason
   to do.
6. **Florida recording-consent confirmation** — recommend an actual
   attorney consult before relying on customer-facing footage from the Meta
   glasses at any commercial volume (see compliance-notes.md). Not blocking
   the MVP (which is Pau's own POV footage, not customers), but blocking
   before scaling customer-facing content.

## Known limitations

- **Resolved 2026-11-26**: object storage is built and verified — see
  "Publishing pipeline connected" below. (Railway itself still isn't
  suitable for hosting a video library or running DaVinci — unchanged,
  but no longer relevant since R2 solves the hosting need directly.)
- **Resolved 2026-11-26** (descoped, not built): no dashboard, and none is
  planned. Pau clarified he drives this pipeline from inside a Claude
  Desktop/Code session, not via an unattended background system — so
  approval IS Pau reviewing the output in that same conversation, and
  publishing is Pau saying "sube esto a Buffer" in that conversation. The
  original Phase 5 dashboard + autonomous-publish design assumed a
  no-Pau-present architecture that doesn't match how this is actually
  used; see "Scope simplified" below.
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
- **Resolved 2026-11-26**: color grade now defaults to the real Lobsteria
  warm LUT (`creative-studio/luts/lobsteria-warm.cube`) via FFmpeg's
  `lut3d` filter, not the plain "quick-look" preset — no DaVinci needed.
  Set `CREATIVE_STUDIO_LUT_PATH=none` to fall back to the plain preset.
- **Resolved 2026-11-26**: fps now varies automatically — `chooseExportFps()`
  exports at 24fps for silent/no-dialogue clips (the B2 "Process Reel"
  profile) and 30fps for anything with spoken dialogue, per
  camera-course-reference.md. Still only one output file per render (no
  separate per-platform crops/durations) — acceptable for now since
  Instagram/TikTok/YouTube Shorts specs converge on the same 1080x1920
  format.
