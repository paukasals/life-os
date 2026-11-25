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
| 3. MVP Pipeline | 🟡 Partial | Ingestion + analysis (FFmpeg + Gemini) built, syntax-checked, FFmpeg smoke-tested with a generated clip. **Not yet run against a real Gemini call or real Lobsteria footage** — blocked on credentials + material (see Blocked On). Edit/render step not started — blocked on a tooling decision (DaVinci on Pau's Mac vs. cloud). |
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
4. **One of the two training PDFs received 2026-11-25**: the Video Plan
   (Weeks 1-2, Oct 12-25) — full shoot calendar, camera system, B1/B2
   reference formats, editing brief, approved/banned words, personal-brand
   account structure. Ingested into `src/knowledge/marketing/video-plan-oct-2026.md`
   and `creative-studio/video-production-spec.md`. Still missing: the
   general photography/video training PDF referenced in the original
   directive (lighting/composition fundamentals, not the week-specific
   shoot plan). Can't invent its content; need the actual file.
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
  there's one `CreativeStudioAgent` doing ingestion + analysis only.
