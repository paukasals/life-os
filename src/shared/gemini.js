import { GoogleGenAI, createPartFromUri, createUserContent } from '@google/genai';

const MODEL = 'gemini-3.8-flash';

const HOOK_RETRY_INSTRUCTION = `

IMPORTANT — this is a retry: a previous cut of this same footage was reviewed and flagged "weak hook" (low 3-second-hold potential per camera-course-reference.md's Reading Results). Focus specifically on the first 2-4 seconds: open on the strongest available visual/spoken moment (payoff-first, a question, or a sharp visual action), not a slow build. Everything after the opening can stay the same if it was already fine — don't change things that weren't the problem.`;

function client() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  return new GoogleGenAI({ apiKey });
}

async function waitUntilActive(ai, fileName, { timeoutMs = 120000, intervalMs = 2000 } = {}) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const file = await ai.files.get({ name: fileName });
    if (file.state === 'ACTIVE') return file;
    if (file.state === 'FAILED') {
      throw new Error(`Gemini file processing failed: ${file.error?.message ?? 'unknown error'}`);
    }
    if (Date.now() > deadline) throw new Error(`Gemini file processing timed out: ${fileName}`);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}

/**
 * Upload a video/image file to Gemini and run it through the Creative Studio
 * QC checklist (brand rules, food safety, legal/compliance, technical
 * quality, virality/hook strength, content pillar fit). Returns the model's
 * raw text response (caller parses/stores it).
 *
 * `qcChecklist` should be the contents of creative-studio/qc-checklist.md —
 * a condensed checklist, not the full reference docs, to keep each call
 * reasonably sized. Pass `source` ('iphone' | 'glasses') since the QC bar
 * differs slightly (glasses footage is fixed ~100° FOV, no zoom, no
 * framing control — don't flag that as a defect).
 */
export async function analyzeMedia(filePath, mimeType, { qcChecklist = '', source = 'iphone' } = {}) {
  const ai = client();
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const active = await waitUntilActive(ai, uploaded.name);

  const sourceNotes = {
    glasses: 'This clip is from Meta Nova POV glasses: fixed ~100° wide angle, no zoom, no framing control while wearing — do not flag wide framing or lack of composition as a defect, that is the format.',
    iphone: 'This clip is from an iPhone (Osmo gimbal or tripod) — normal framing/composition standards apply.',
    rendered: 'This is a FINISHED, EDITED RENDER — already cut together from one or more sources, graded, and captioned. Do not re-litigate raw-footage framing choices. Instead check the OVERALL result: do the cuts feel smooth (no jarring jumps or awkward mid-action cuts), did editing introduce any new problem (captions overlapping important content, a cut landing on a bad frame), and does the finished piece still clear every checklist item now that it is assembled.',
  };
  const sourceNote = sourceNotes[source] ?? sourceNotes.iphone;

  const prompt = `You are the Quality Assurance step for Lobsteria Creative Studio, reviewing one piece of raw footage/photo before it goes any further in the pipeline. ${sourceNote}

QC checklist to apply:
${qcChecklist || '(no checklist provided — use general food-content judgment)'}

Respond in this exact structure, one line per field, "none" if nothing applies:

SUMMARY: (1-2 sentences, what's actually in the shot)
USABLE_CLIPS: (timestamps/regions usable for social content, or "none" / "whole thing" for a photo)
BRAND_RULE_RISKS: (specific checklist violations found, or "none")
FOOD_SAFETY_FLAGS: (gloves missing, bare-hand contact, etc., or "none")
LEGAL_FLAGS: (recognizable faces without known consent, minors, murals in focus, background music, or "none")
TECHNICAL_FLAGS: (exposure, color temp, shake, framing — skip framing/zoom complaints for glasses source — or "none")
HOOK_STRENGTH: (strong / weak / unclear, with a one-line reason — weak means the first 2-4s needs a re-cut, not a reshoot)
CONTENT_PILLAR_FIT: (Product / Story / Vibe / Social Proof)
RECOMMENDATION: (post-worthy / needs re-cut / needs reshoot / do-not-post, with a one-line reason)`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([
      createPartFromUri(active.uri, mimeType),
      prompt,
    ]),
  });

  return response.text;
}

const TRANSCRIPT_SCHEMA = {
  type: 'object',
  properties: {
    language: { type: 'string', description: 'Primary spoken language, e.g. "en" or "es"' },
    segments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          start: { type: 'number', description: 'Start time in seconds, source timeline' },
          end: { type: 'number', description: 'End time in seconds, source timeline' },
          text: { type: 'string', description: 'What is said, or "" for silent/action-only segments' },
          keep: { type: 'boolean', description: 'true = include in the final cut, false = remove' },
          reason: { type: 'string', description: 'Why kept or removed, e.g. "filler word", "dead air", "redo of a cleaner later take", "clean delivery"' },
        },
        required: ['start', 'end', 'text', 'keep', 'reason'],
      },
    },
  },
  required: ['language', 'segments'],
};

/**
 * Transcribe a talking video with timestamps and decide which segments to
 * keep vs. cut: filler words ("um", "eh", false starts), dead air/long
 * pauses, and — when a line is said more than once in the same clip —
 * earlier redone attempts (keeps only the cleanest delivery). Segments
 * covering pure action with no speech (e.g. a silent process shot) come
 * back with text:"" and keep:true by default — the caller can override via
 * `minSegmentSeconds` filtering if needed.
 *
 * This does NOT compare across multiple separate files (e.g. picking the
 * better of two different takes recorded as separate clips) — that's a
 * separate, not-yet-built feature. Scoped to decisions possible from a
 * single clip's own transcript.
 */
export async function transcribeAndDecideCuts(filePath, mimeType, { language = 'auto-detect (English or Spanish)', strengthenHook = false } = {}) {
  const ai = client();
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const active = await waitUntilActive(ai, uploaded.name);

  const prompt = `Transcribe this video's spoken audio with precise segment timestamps (language: ${language}). Break it into short segments (phrases or sentences, a few seconds each).

For each segment, decide keep=true or keep=false:
- keep=false: filler words/sounds ("um", "eh", "este", "o sea" used as a verbal tic), dead air or a long unintentional pause, a stutter/false start, or an earlier redo of a line that gets said again more cleanly later in the clip (keep only the cleanest final delivery of a repeated line).
- keep=true: clean delivery, meaningful silence that's part of the action (e.g. someone handing over food, a reaction shot), or any segment with no speech that shows real action.

Be conservative: when genuinely unsure, keep=true — an under-aggressive cut is recoverable by hand, an over-aggressive one loses real footage. Give a short, specific reason for every segment, not a generic one.${strengthenHook ? HOOK_RETRY_INSTRUCTION : ''}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([
      createPartFromUri(active.uri, mimeType),
      prompt,
    ]),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: TRANSCRIPT_SCHEMA,
    },
  });

  return JSON.parse(response.text);
}

const MULTICAM_SCHEMA = {
  type: 'object',
  properties: {
    segments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          role: { type: 'string', description: 'Which source camera this segment uses — must be one of the role names given in the prompt' },
          start: { type: 'number', description: "Start time in seconds, in THAT camera's OWN local timeline (not a shared/synced timeline)" },
          end: { type: 'number', description: "End time in seconds, in THAT camera's OWN local timeline" },
          text: { type: 'string', description: 'What is said/shown, or "" for silent action' },
          reason: { type: 'string', description: 'Why this camera for this moment, e.g. "Cam B shows the hands on the key word", "Cam A for the direct-address line", "glasses POV for the hand-off reaction"' },
        },
        required: ['role', 'start', 'end', 'text', 'reason'],
      },
    },
  },
  required: ['segments'],
};

/**
 * Given 2-3 synchronized recordings of the SAME real moment (e.g. Cam A on
 * the Osmo + Cam B on the tripod, optionally + Meta Nova glasses POV),
 * jointly decide which camera to show for each moment of the story and
 * produce one ordered edit decision list — the "cut between Cam A and Cam
 * B" grammar already written out per-video in shot-cards.md, generalized
 * so it works on whatever footage actually comes in.
 *
 * Gemini watches all sources together and matches them semantically (same
 * words spoken, same action happening) rather than needing numeric sync —
 * each returned segment's start/end is in THAT SOURCE's own local
 * timeline, directly usable by ffmpeg.js's renderMulticamCut with no
 * further conversion. (sync.js's clap-offset math is a separate, optional
 * path — useful for precise frame-accurate alignment, not required for
 * this semantic approach.)
 *
 * Filler words/pauses are still cut per the same rules as
 * transcribeAndDecideCuts, applied per source before being included.
 *
 * `sources`: [{ role, filePath, mimeType }, ...] — role names are free text
 * but must be used consistently (e.g. 'camA', 'camB', 'glasses') since the
 * caller maps them back to actual files by role.
 */
export async function decideMulticamEdit(sources, { editingGrammar = '', strengthenHook = false } = {}) {
  const ai = client();

  const uploadedParts = [];
  for (const { role, filePath, mimeType } of sources) {
    const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
    const active = await waitUntilActive(ai, uploaded.name);
    uploadedParts.push(createPartFromUri(active.uri, mimeType));
    uploadedParts.push(`(The video above is role="${role}".)`);
  }

  const roleNames = sources.map((s) => s.role).join(', ');
  const prompt = `These ${sources.length} videos (roles: ${roleNames}) are synchronized recordings of the SAME real moment, shot simultaneously from different cameras — match them by what's actually said/shown, not by numeric timing.

${editingGrammar ? `Editing grammar to follow for this video:\n${editingGrammar}\n\n` : ''}
Produce ONE ordered list of segments covering the full story from start to end, choosing the best camera (role) for each moment — e.g. the camera showing the speaker's face for a direct-address line, the camera showing hands/food for a demonstrated action, glasses POV for a genuine first-person moment. Cut filler words, dead air, false starts and redone lines the same way you would for a single clip — keep only the cleanest version of anything repeated.

Each segment's start/end must be in that SPECIFIC source's own local timeline (seconds from the start of that file), not a shared clock. Be conservative on cuts: keep when unsure.${strengthenHook ? HOOK_RETRY_INSTRUCTION : ''}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([...uploadedParts, prompt]),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: MULTICAM_SCHEMA,
    },
  });

  return JSON.parse(response.text);
}

const TRANSLATION_SCHEMA = {
  type: 'object',
  properties: {
    targetLanguage: { type: 'string' },
    translations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          index: { type: 'number', description: 'Matches the index given in the input list' },
          text: { type: 'string', description: 'Natural, spoken-register translation — not literal word-for-word' },
        },
        required: ['index', 'text'],
      },
    },
  },
  required: ['targetLanguage', 'translations'],
};

/**
 * Translate kept segments into the OPPOSITE language for burned-in
 * captions — per brand-rules.md's bilingual system: speak in one
 * language, subtitle in the other (English speech -> Spanish captions,
 * and vice versa). This is a real rule, not a nice-to-have: captions
 * should never just repeat the spoken language.
 *
 * `segments`: [{ text, ... }] — only `text` and array order matter here;
 * returns the SAME array with `text` replaced by the opposite-language
 * translation, everything else (start/end/role) untouched, ready to pass
 * straight to buildSrtForCut.
 */
export async function translateSegments(segments, { fromLanguage = 'auto-detect' } = {}) {
  const ai = client();
  const nonEmpty = segments.map((s, i) => ({ i, text: s.text })).filter((s) => s.text && s.text.trim());

  if (nonEmpty.length === 0) {
    return segments; // nothing to translate (silent/action-only clip)
  }

  const prompt = `Source language: ${fromLanguage}. Translate each of these spoken-video caption lines into the OPPOSITE language (English -> Spanish, Spanish -> English). Keep it natural and conversational, matching the tone of someone talking at a food truck window — not a literal or formal translation.

Lines (by index):
${nonEmpty.map((s) => `${s.i}: ${s.text}`).join('\n')}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([prompt]),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: TRANSLATION_SCHEMA,
    },
  });

  const { translations } = JSON.parse(response.text);
  const byIndex = new Map(translations.map((t) => [t.index, t.text]));

  return segments.map((seg, i) => (byIndex.has(i) ? { ...seg, text: byIndex.get(i) } : seg));
}

const COVER_FRAME_SCHEMA = {
  type: 'object',
  properties: {
    timestampSeconds: { type: 'number', description: 'The single best moment for a cover/thumbnail frame' },
    reason: { type: 'string' },
  },
  required: ['timestampSeconds', 'reason'],
};

/**
 * Pick the single best cover/thumbnail frame — per the posting-system rule
 * (video-plan-oct-2026.md): "a frame with the food centered." Replaces a
 * naive midpoint-frame grab with an actual content-aware choice.
 */
export async function selectCoverFrame(filePath, mimeType) {
  const ai = client();
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const active = await waitUntilActive(ai, uploaded.name);

  const prompt = `Pick the single best frame in this video to use as the cover/thumbnail image — the moment the food (or, for a talking video, Pau) is most clearly and attractively in frame, well-lit, centered, nothing mid-motion or blurry. This is the first thing a scroller sees before the video even plays.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([createPartFromUri(active.uri, mimeType), prompt]),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: COVER_FRAME_SCHEMA,
    },
  });

  return JSON.parse(response.text);
}

/**
 * Detect the sync clap/sharp-transient sound in a clip and return its
 * timestamp (seconds) in that file's own local timeline. Optional,
 * precise-alignment path — not required by decideMulticamEdit's semantic
 * matching, but useful when frame-accurate sync matters more than
 * Gemini's own content-matching (e.g. very short cutaways with little
 * distinguishing dialogue).
 */
export async function detectSyncPoint(filePath, mimeType) {
  const ai = client();
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const active = await waitUntilActive(ai, uploaded.name);

  const prompt = `This clip starts with a single clap (hands clapped together once) used to sync multiple cameras. Find the exact timestamp, in seconds, of the clap sound. Respond with ONLY the number of seconds (e.g. "1.433"), nothing else.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([createPartFromUri(active.uri, mimeType), prompt]),
  });

  const seconds = parseFloat(response.text.trim());
  if (Number.isNaN(seconds)) {
    throw new Error(`detectSyncPoint: could not parse a clap timestamp from Gemini's response: "${response.text}"`);
  }
  return seconds;
}

/**
 * Given 2+ SEPARATE, NOT-simultaneous full recordings of the same intended
 * video (e.g. Pau records all of V2 once, isn't happy with it, records the
 * whole thing again later as its own file) — different from
 * decideMulticamEdit, which assumes synchronized/simultaneous sources.
 * These takes happen at different times and can't be "cut between" at a
 * shared timestamp; instead this compares them on content and delivery,
 * then assembles the best version: either one take used throughout (if one
 * is simply best), or the best delivery of each part of the script pulled
 * from whichever take nailed it — mirroring the course's own rule ("record
 * 3 full takes, keep the most natural one," generalized to a composite
 * when that serves the result better than any single take alone).
 *
 * Returns the same { segments: [{ role, start, end, text, reason }] }
 * shape as decideMulticamEdit — `role` here means "take1"/"take2"/etc.,
 * and the result is renderable with the exact same renderMulticamCut
 * (same mechanics: cut from whichever file each segment calls for).
 *
 * `script` (optional): the known intended script/lines for this video
 * (e.g. the SAY (EN)/SAY (ES) text from shot-cards.md) — give it when
 * available, it helps Gemini align takes that may have been delivered
 * slightly differently in wording each time.
 */
export async function decideBestOfRetakes(takes, { script = '', strengthenHook = false } = {}) {
  const ai = client();

  const uploadedParts = [];
  for (const { role, filePath, mimeType } of takes) {
    const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
    const active = await waitUntilActive(ai, uploaded.name);
    uploadedParts.push(createPartFromUri(active.uri, mimeType));
    uploadedParts.push(`(The video above is role="${role}".)`);
  }

  const roleNames = takes.map((t) => t.role).join(', ');
  const prompt = `These ${takes.length} videos (roles: ${roleNames}) are SEPARATE, independently recorded full attempts at the SAME intended video — NOT simultaneous cameras of one event. They were recorded at different times, possibly with slightly different wording or pacing each time.

${script ? `Intended script for this video:\n${script}\n\n` : ''}
Compare the takes on delivery quality (energy, naturalness, clean pacing, no stumbles — see the course's own rule: keep the most natural, not the most "perfect" line-reading) and on technical cleanliness (focus, framing, lighting consistency with the rest of the clip).

Produce ONE ordered list of segments assembling the best possible final version of the script from start to end. If one take is simply best throughout, the segments will naturally all point to that one role — that's a valid outcome, don't force variety. If different takes deliver different parts better, composite across them. Still cut filler words, dead air and false starts the same as you would within a single clip.

Each segment's start/end must be in that SPECIFIC take's own local timeline (seconds from the start of that file). Be conservative: when two deliveries are close in quality, prefer the one that also lines up best with its neighbors to avoid an awkward tone jump between segments pulled from different takes.${strengthenHook ? HOOK_RETRY_INSTRUCTION : ''}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([...uploadedParts, prompt]),
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: MULTICAM_SCHEMA,
    },
  });

  return JSON.parse(response.text);
}
