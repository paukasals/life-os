# Lobsteria Video Production Spec

Source: `LOBSTERIA_Video_Plan_Weeks_1-2_v2.pdf`, uploaded 2026-11-25. This is
the real camera/editing grammar for Lobsteria content — the Gemini analysis
step and any future automated editing step should check footage/cuts against
this, not invent conventions.

## Camera system (as actually used, not 3 simultaneous cameras)

Two phones, repositioned per shot — not three cameras running at once. Meta
glasses are **not used** in this video plan; if Pau wants POV glasses
footage, it needs to be added to a plan explicitly.

**Cam A** = iPhone on DJI Osmo Mobile 7P (gimbal + Neewer tripod base).
**Cam B** = iPhone on the Neewer tripod's phone holder (45°) OR on the
overhead clamp arm (90°/cenital), depending on the shot.

### Food videos (V1, V5, V6, V8, V9 — "Process Reel" look, B2)
- Both phones **fixed, tracking off**, keep recording.
- Cam B (Neewer): 45° food angle. Cam A (Osmo on counter): wider angle.
- 4K60 normally, **4K24 for Process Reel videos (B2 spec)**. HDR off. 9:16.
- Lock white balance; exposure locked and pulled down -0.5 to -0.7 (keeps
  shiny butter from blowing out).
- Macro Control on; lens chosen before the take (no automatic macro jump).
- 45° hero shots: 4x telephoto (~100mm equivalent) from ~1m — better
  compression, phone stays away from heat.
- Light from the back-side (~135°) with the overheads off.
- Audio: DJI Mic Mini TX just off-frame, pointing down at the food, noise
  cancelling off. Key-to-fill ratio about 2:1.
- No gestures while handling food. Push-ins are done as crops in the edit,
  not zoomed live.

### Pau-speaking videos (V2, V7, V10)
- Cam A (Osmo, **face tracking ON**), waist-up, 1x, 4K30. Mic Mini on the
  collar — pairs straight to the Osmo module (up to 2 transmitters, no
  receiver needed).
- Key light at 45°, slightly above face; warm Airstream glow behind.
- 5 read-throughs out loud before recording. Never make the "V" sign
  mid-take (starts/stops recording on some setups). Palm gesture only
  between full sentences, never mid-action.
- Cam B fixed on hands or the food. Clap once to sync the two cameras.
- Burn in corrected auto-captions, one line at a time.

## Look and hygiene (every video)
- Warm amber color; food is always the brightest thing in frame.
- Daylight or the Airstream's own warm light; a supplemental LED (ULANZI)
  only if a test looks natural — its stock color temp (8500K) reads cold/
  blue, don't trust it to warm on its own.
- **Black nitrile gloves** on any ready-to-eat food (cooked lobster, caviar,
  ceviche assembly) — food-safe and reads better on camera than clear
  gloves. New pair per take.
- Owner look: Lobsteria tee or a clean black shirt with an apron. **No chef
  jacket.** Pau is always "the owner," never "the chef" (ties directly to
  brand-rules.md).
- Wipe lenses — kitchen grease reads as soft/hazy footage.

## Reference formats

### B1 — Counter Note (announcements: hours, holidays, Event Box deadlines)
- Story or Reel, 8-12s, silent.
- Camera B overhead (90°) over the steel counter. A hand writes a short,
  true message in marker on a stainless tray or parchment (never on a
  food-contact surface — food safety). A finished roll is placed on top of
  the writing once done.
- Only write what's actually true that day (e.g., "Open tonight 5pm→2am,"
  "Event Boxes: order by Thursday for the weekend").

### B2 — The Process Reel (standard look for food-process videos)
- Reel, 20-35s, voiceover or real sound.
- Structure: (1) finished roll first, as the hook, 0-1.5s. (2) "Here's how
  we make it" — process close-ups, one cut every ~1.2s, voice explains why
  (claw & knuckle = sweetest, most tender meat). (3) finished roll again,
  Airstream behind.
- Camera: 4K 24fps (not 60 — 24 gives the soft, film-like motion). Exposure/
  white balance locked. 2x or 4x lens, 30-50cm from food for blurry
  backgrounds (Cinematic mode OK). Fill the frame with hands/knife/steel
  bowls/lobster, black gloves on ready-to-eat food. Hold each step 3-5s so
  there's a clean 1.2s to cut.
- Grade (now, basic — in CapCut/InVideo preset, reuse every time): warm the
  image, lift shadows slightly, slightly lower saturation, a touch of teal
  in the shadows, grain 10-15%, light vignette.
- Grade (later, pro — once DaVinci is in the loop): shoot Apple Log, one
  warm film LUT at ~80% strength on an adjustment layer, exposure/WB fixed
  first.
- Captions: auto-captions, corrected, white bold sans with soft shadow,
  centered, 3-5 words at a time. Bilingual: Spanish subtitles on English
  voice and vice versa.
- Voiceover: Pau as the owner, calm, close to mic, **recorded after the
  shoot over the edit** (not while cooking — easier to get right).
- Rule: team's hands on camera are fine (with consent); if Pau appears,
  owner clothes only, never a chef jacket. Show the butter going on, never
  what's in it — no "fresh"/"frozen" ever.
- Export: 1080x1920, **24fps for B2 videos only** — everything else stays
  30fps.
- One session (~20 min before opening) can feed 2-3 B2 Reels: finished roll
  hero → claw crack → knuckle pick → cleaning → meat in the bowl → bun on
  the griddle → butter going on → filling → chives → finished roll hero
  again.

## Editing brief (the literal instruction set used today, paste-into-tool
style — this is what the future automated editor should reproduce)
- Sync Cam A and B by the clap (audio waveform sync).
- Cut the first frames before any action — the video should open mid-
  movement, not on a static start.
- Use Cam B for food, Cam A for Pau talking.
- Remove gestures and settling pauses, covering with the other camera's
  footage — never cut a pour or spoon placement halfway through.
- Subtle crop push-ins at the hero moments (the crack, the pour, the caviar,
  the box fill).
- One line of cream-colored text at a time, bottom third, clear of the
  platform's UI buttons, same font every video.
- Warm, natural color. A signature commercial-library track, low under
  speech and real sound (never Instagram-licensed music reposted to
  YouTube/TikTok — gets muted/blocked on business accounts; pick 3 tracks
  and reuse them as the signature sound).
- Hook text at 0s. End text on the last 2s, built to loop back into the
  first frame on silent Process Reels.
- First "hit of value" (the food at its best, or the main point) within 4
  seconds.
- Speed ramps timed to the music beat (CapCut Speed → Curve → Custom).
- Workflow order: add captions first, then edit around them.
- Mostly straight cuts; if using a transition, 0.3-0.4s.

## What this means for the Creative Studio pipeline
- The Gemini analysis prompt (`src/shared/gemini.js`) should eventually
  check footage against this spec too (e.g., flag a clip where gloves are
  missing on ready-to-eat food, or where a chef jacket appears) — not yet
  added, since it needs real footage to test against first.
- The eventual auto-cut/editor step should default to this B2 grade preset
  and caption style rather than inventing a new look each time.
