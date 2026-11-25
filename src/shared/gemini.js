import { GoogleGenAI, createPartFromUri, createUserContent } from '@google/genai';

const MODEL = 'gemini-3.8-flash';

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

  const sourceNote = source === 'glasses'
    ? 'This clip is from Meta Nova POV glasses: fixed ~100° wide angle, no zoom, no framing control while wearing — do not flag wide framing or lack of composition as a defect, that is the format.'
    : 'This clip is from an iPhone (Osmo gimbal or tripod) — normal framing/composition standards apply.';

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
export async function transcribeAndDecideCuts(filePath, mimeType, { language = 'auto-detect (English or Spanish)' } = {}) {
  const ai = client();
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const active = await waitUntilActive(ai, uploaded.name);

  const prompt = `Transcribe this video's spoken audio with precise segment timestamps (language: ${language}). Break it into short segments (phrases or sentences, a few seconds each).

For each segment, decide keep=true or keep=false:
- keep=false: filler words/sounds ("um", "eh", "este", "o sea" used as a verbal tic), dead air or a long unintentional pause, a stutter/false start, or an earlier redo of a line that gets said again more cleanly later in the clip (keep only the cleanest final delivery of a repeated line).
- keep=true: clean delivery, meaningful silence that's part of the action (e.g. someone handing over food, a reaction shot), or any segment with no speech that shows real action.

Be conservative: when genuinely unsure, keep=true — an under-aggressive cut is recoverable by hand, an over-aggressive one loses real footage. Give a short, specific reason for every segment, not a generic one.`;

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
