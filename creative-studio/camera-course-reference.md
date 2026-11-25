# Lobsteria Camera Course — Technical Reference

Source: `LOBSTERIA_Camera_Course.pdf` (v3, Oct 12 2026), uploaded 2026-11-25.
This is Pau's own 8-week, 14-module training course, built for his exact
gear (2x iPhone 17 Pro Max, DJI Osmo Mobile 7P, Neewer tripod, DJI Mic Mini,
ULANZI light). This file extracts the technical rules the Creative Studio
pipeline (Gemini QC, future auto-editor) should check footage against — not
the per-video shot lists, which live in `shot-cards.md`.

## Confirmed: Meta glasses are NOT part of the current shooting system
The course says explicitly: "Meta glasses: not part of this course until you
own them." Combined with the Video Plan PDF (also no glasses usage), the
active capture system is **2 iPhones only** — Cam A (Osmo Mobile 7P) + Cam B
(Neewer tripod or overhead clamp). If Pau wants glasses POV footage folded
in, it needs an explicit addition to the plan, not an assumption.

## Camera settings (iPhone 17 Pro Max)

**Native Camera app (BASIC, use for weeks 1-5):**
- 4K 30fps for talking/night/walk-ups; 4K 60fps for process shots (lets you
  slow to 50%). Slo-mo 4K120 for pours/cracks/caviar, used sparingly (1-2
  shots per video).
- High Efficiency (HEVC), ProRes off at BASIC level. HDR **off** always
  (washes out skin/food tones, inconsistent across Instagram/CapCut).
  Grid + Level on. Lock camera + lens correction on (stops the phone
  switching lenses mid-shot — e.g. the "macro jump").
- Before every take: long-press the food → AE/AF Lock, then drag exposure
  down -0.3 to -0.7 so the brightest food isn't blown out.
- Lenses: 0.5x (ultra-wide, also macro when very close), 1x (main, best
  quality/low light — use it most), 2x (a crop of the main sensor, good for
  45° food with less distortion), 4x telephoto (100mm equivalent,
  compresses background, best for hero shots from a distance). **Rule:
  choose the lens before recording, never zoom while recording.** In-between
  zoom values (0.7x, 3x) are lower-quality digital crops — avoid them.
- Storage: 4K60 HEVC ≈ 400MB/minute. Keep 50GB free before every shoot.

**PRO stage (Blackmagic Camera app, free, from week 6):**
- Shutter angle 180° → shutter = 2x frame rate (1/60 at 30fps, 1/120 at
  60fps) for natural motion blur. Lock it so tapping the screen only
  changes focus.
- Flicker: US runs on 60Hz power — use 1/60 or 1/120 under LEDs/the
  Airstream's lights at night, never odd shutter values, or the image
  pulses.
- White balance locked (4000-4500K for the warm Airstream look) so color
  doesn't drift between shots.
- ISO as low as light allows (55-400) — add light instead of raising ISO.
- Apple Log 2: flat, gray image that preserves detail in shiny butter and
  dark Airstream shadows. **Must be color graded** (see Editing below) —
  deliver in SDR/Rec.709, never ship raw Log footage.
- Multicam: both phones at the same fps, shutter, WB, and Log/no-Log, or
  they won't match in the edit.
- Daylight in Miami sun at 1/60 can overexpose (true "cinematic" shutter) —
  either let the native app auto-pick shutter in daylight, or use an ND
  filter (see Gear).

## Lighting

**Four properties:** quantity (enough to keep ISO low), quality (soft/
diffused beats hard/small for food), direction (side 90° or back-side 135°
makes texture/butter shine; front light flattens food; top light makes
harsh shadows), color temperature (warm 2700-3200K / neutral 4000-4500K /
daylight 5600K — **never mix color temperatures in one frame**, it looks
cheap).

**Lobsteria's look — "warm amber, food brightest":**
- Day: open the window/door on one side as the key light, turn off the
  Airstream's overhead lights, white foam board opposite to fill shadows,
  black board to kill steel reflections.
- Night: the Airstream's own warm lights as the base, plus one warm,
  diffused light on the food only. Lock white balance.
- Butter/mayo shine needs the light **behind-side** so the sheen faces the
  camera.
- The ULANZI light is 8500K (cold/blue) — only use it bounced off a warm
  surface or with a warming gel (CTO), otherwise it clashes with the warm
  look.
- Talking to camera: one soft light at 45°, slightly above eye level; the
  Airstream glow behind as separation; never just the ceiling light alone.
  The Osmo 7P's built-in fill light (4 brightness/4 color-temp levels) works
  for talking/lives, not food hero shots.
- Key-to-fill ratio about 2:1 (fill half as bright as the key).

## Sound (DJI Mic Mini)

- **Receiver (RX) plugged into the iPhone's USB-C beats Bluetooth** —
  Bluetooth compresses audio; the native Camera app doesn't support it well
  anyway.
- Food sounds: TX placed 20-40cm from the action, out of frame, never
  touching heat. Noise cancelling **off** (it can erase sizzle/cracks).
- Talking: TX clipped ~a hand's width below the chin, noise cancelling
  **on** (street/generator/music noise). The Osmo 7P's multifunctional
  module connects up to 2 Mic Mini transmitters directly — no separate
  receiver needed when filming with the gimbal.
- Gain: set so the loudest moment doesn't distort; test, record, listen
  back with headphones. Record 10 seconds of room tone each session (hides
  edit cuts).
- Music: use Instagram/TikTok's own commercial sound library, or
  royalty-free in CapCut — never Instagram-licensed music reposted to
  YouTube/TikTok (gets muted/blocked on business accounts). Voice loud and
  clear; music ~20dB under the voice; food sounds a bit louder than music.

## Movement (Osmo Mobile 7P)

- Food action = still camera (the pour/crack IS the movement). Places/
  reveals = moving camera (walk-up, lettering, box carried out).
- **The 6 moves:** push-in (slow toward food), pull-out/reveal (macro to
  full roll or Airstream), slide (sideways past the roll with foreground
  depth), tilt-up reveal (counter to face), orbit (half-circle around the
  roll, slow), walk/POV (chest height, slow steps, soft knees).
- Osmo modes: Follow (most natural), Tilt Locked, FPV (dramatic only),
  Spin. Built-in tripod for the counter/low 45° shots.
- **Multifunctional module tracks PEOPLE, not food** — starts tracking on a
  palm gesture. Use for Pau talking; turn tracking off for food shots.
  ActiveTrack via DJI Mimo: tap a subject box, circle for an arc shot, or
  walk alongside for a pan.
- Gesture warning: the V-sign starts/stops *recording* after a 3-second
  countdown on some setups — never make it mid-take by accident. Palm
  gesture only between full sentences, never mid-action.
- B-roll rule: film 10 extra 5-second b-roll clips every session (hands,
  ingredients, steam, steel, signage, customers' hands with consent) — they
  save every edit.

## Food styling (lobster rolls)

- Build 2 (hero + backup) — food under light dies in 3-5 minutes (butter
  sets, bun goes dull, mayo weeps).
- Bun: evenly golden both sides, pick the most symmetrical of the batch.
- Lobster placement: best claw pieces on top facing camera, red side out;
  knuckle meat underneath for volume; slightly overfilled in the middle so
  it rises.
- Connecticut: brush butter just before the take, light shine, no pools;
  shoot while warm (a hint of steam is gold). Maine: dressed just enough to
  coat, mayo sheen, no blobs, chives placed with tweezers.
- Caviar: a neat spoonful (quenelle) placed in one motion, pearls intact.
- Surface: steel counter, wood board, or branded paper liner. One prop
  maximum. No plastic cutlery, no clutter.
- **Food safety on camera:** black nitrile gloves for any ready-to-eat food
  (cooked lobster, assembly, caviar), new pair per take, clean counter, hair
  tied/capped. "The camera sees everything, and so do health inspectors."

## Speaking on camera (10 rules)

1. Look into the lens (sticker next to it as a reminder).
2. Talk to one person (a regular at the window), not "everyone."
3. Start mid-action and mid-sentence — never "hi guys, today...".
4. Speak ~20% slower than feels natural; pause between ideas (pauses are
   where cuts go).
5. One idea per video — 3 bullet points, never a full script to read.
6. Smile before you start — your first frame becomes the cover.
7. Energy +20% — the camera flattens energy.
8. Keep hands busy (cracking, wiping, handing out a roll) — owners who work
   while talking look natural.
9. Record 3 full takes, keep the most natural, not the most perfect.
10. Say only what's true (claims rules apply here too).

**Bilingual system:** one language per video, subtitle the opposite
language. English for US/tourist reach, Spanish for Latin audience/
Barcelona stories. Every 3rd talking video in Spanish is a good balance for
Miami.

## Editing

**Tool verdict:**
- **CapCut** — main editor. Full timeline, speed curves, keyframes, LUTs,
  auto captions, export control.
- **Edits (Instagram's app)** — good second option, free, good captions, no
  watermark, shows Instagram Insights. Use for quick Owner Diary edits.
- **InVideo AI — use only for rough cuts or repurposing, after testing it on
  one real video. It must never replace a proper edit.** Reviewers find its
  manual editing of your own footage basic and clunky. *(Relevant to the
  Creative Studio pipeline: this independently confirms the approach
  already taken here — a rule-based FFmpeg/transcript-driven cut, not a
  generic "AI generates the edit" tool, for anything that needs to look
  professional.)*

**The edit recipe (every video), 10 steps:**
1. Select: import both cameras, delete bad takes, sync with the clap.
2. Rough cut: shots in story order (hook, build, payoff); cut the first
   frames so it starts mid-motion.
3. Rhythm: process shots 1.5-3s; cut on action, mid-movement.
4. Speed: 60fps clips at 50% for pours; speed ramps (fast → slow at impact
   → fast).
5. Crop moves: gentle 100→115% push-ins at key moments.
6. Text: one line, same font, cream/white, in the safe middle band. Hook at
   0s, end text in the last 2s.
7. Captions: auto captions → fix every word → add the opposite-language
   subtitle.
8. Color: warm, natural, match both cameras. Log footage: Apple's LUT
   first, then adjust (PRO).
9. Sound: voice loudest; music ~20dB under voice; food sounds louder than
   music; room tone under cuts.
10. Export: 1080x1920 (or 4K), 30fps (24fps only for "Process Reel"/B2-style
    videos), high bitrate. Upload over Wi-Fi.

**Color grading (PRO, Apple Log 2):** put the LUT on an adjustment layer
above all clips (grading Log footage without this wastes the point of
shooting Log). Fix exposure/contrast/white balance first, then apply the
LUT at ~80% strength if it's too strong. Quick-look alternative: slight
brightness/contrast up, highlights down, warmer temperature, a film filter
at low intensity (~35-40%).

Transitions: 0.3-0.4s, used rarely — mostly straight cuts.

## Publishing specs
- Format: 9:16, 1080x1920 minimum. Reels/TikTok: 7-20s process, 25-45s
  talking. YouTube Shorts: up to 3 minutes, keep the same lengths.
- Safe zones: keep text/faces out of the top ~15%, bottom ~25%, right ~15%
  (platform buttons).
- Cross-posting: upload the original file natively to TikTok/YouTube — never
  the Instagram-downloaded, re-encoded, watermarked version.

## Legal and safety (adds to compliance-notes.md — do not treat as
duplicate, these are additional specific rules)
- **People:** ask before filming any customer or staff member; ask again
  before posting a recognizable face. **Never film minors without a
  parent's OK.**
- **Wynwood murals:** murals are the artists' copyrighted work — artists
  have taken brands to court for using murals in commercial content. Keep
  murals out of frame, or blurred in the background only, unless Pau has
  the artist's permission.
- Music: only platforms' commercial libraries or royalty-free tracks. No
  songs playing audibly in the background of a shot either (gets the video
  muted/blocked the same as using the song directly).
- Food safety on camera: gloves, clean surfaces, no bare-hand contact with
  ready-to-eat food.
- Claims: only the approved lobster wording (brand-rules.md) — no "fresh,"
  "frozen," tail, or competitor talk.
- Safety: tripods kept away from heat and walkways; mic never on hot
  surfaces.

## Reading results (engagement benchmarks)
- 3-second hold (skip rate): is the hook working? Under 40% hold → rework
  the first 2 seconds, not the idea.
- Average watch time vs. length: above 50% good, above 80% excellent
  (loops count).
- Shares and saves: the strongest signal of content people actually value.
- % non-followers: reach outside the existing follower base — the real
  growth number.
- Profile visits, link taps, GA4 UTM sessions: did it actually bring
  customers (ties to the tracked-link system in video-plan-oct-2026.md).
- Weekly ritual (20 min, Monday): best and worst video, why, one change for
  next week.

## Gear still to buy (priority order, from the course)
1. Bi-color LED with softbox (replaces the ULANZI's cold 8500K) — priority 1
2. White + black foam boards (fill/flag) — priority 1
3. Styling kit: long tweezers, pastry brush, squeeze/spray bottle, black
   nitrile gloves, microfiber lens cloths — priority 1
4. Small bi-color pocket light (night accent/rim) — priority 2
5. Overhead arm or magic arm + super clamp (safe overhead shots) —
   priority 2
6. Second tripod/phone stand (Cam B for every two-camera shoot) —
   priority 2
7. External SSD (USB-C, 1TB) for backups / future ProRes-Log recording —
   priority 3
8. ND filter for iPhone (fixes Miami daylight overexposure at a cinematic
   shutter) — priority 3
9. **Skip:** clip-on macro lens — the 17 Pro Max's ultra-wide already does
   macro.

## Before/after every shoot (checklists)
**Before:** both phones charged, 50GB free, Do Not Disturb, lenses wiped,
settings set (4K30 talk / 4K60 process / 120 slo-mo), HDR off, grid on, lock
camera on, mic charged + RX in USB-C + test recording played back, light set
(overheads off, boards in place), hero + backup rolls ready (gloves,
tweezers, brush, lime, chives), food zone taped, tripods clear of
heat/walkways, speaker music off, murals out of frame, consent asked, clap
planned, 10 extra b-roll clips planned, 10s room tone planned.

**After:** album per video ID, favorite the best takes, AirDrop B→A or to
the MacBook, back up originals, edit with the recipe above, captions in both
languages, check safe zones/text spelling/claims rules, post per the plan,
reply to comments within 2 hours, Monday 20-minute Insights review.

## Part C — the 8-week personal training plan
This is Pau's own learning curriculum (1h theory + 2h practice/day), not a
pipeline task — included here for reference/continuity, not something the
Creative Studio agent executes.

| Week | Level | Outcome |
|---|---|---|
| 1 | Basic | Know what makes food video work; phones set up |
| 2 | Basic | Clean light and sound every time |
| 3 | Basic | Hero rolls look great on camera; organized files |
| 4 | Intermediate | Confident moves and confident speaking |
| 5 | Intermediate | Edits look professional; first live done |
| 6 | Pro | A cinematic, consistent color look (Apple Log 2 + LUT) |
| 7 | Pro | Production with help — two matched camera angles, a trained staff operator |
| 8 | Pro | Own repeatable LOBSTERIA style — templates, series design |
