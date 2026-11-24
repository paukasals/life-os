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
 * Upload a video/image file to Gemini and ask it to analyze it for Lobsteria
 * creative content: what's in frame, usable clips, quality flags, brand-rule
 * risks. Returns the model's raw text response (caller parses/stores it).
 */
export async function analyzeMedia(filePath, mimeType, { brandRules = '' } = {}) {
  const ai = client();
  const uploaded = await ai.files.upload({ file: filePath, config: { mimeType } });
  const active = await waitUntilActive(ai, uploaded.name);

  const prompt = `You are reviewing raw footage/photos for Lobsteria, a Miami lobster roll Airstream food truck, for use in social content.

${brandRules ? `Mandatory brand rules to check against:\n${brandRules}\n\n` : ''}
Analyze this media and respond in this exact structure:

SUMMARY: (1-2 sentences, what's actually in the shot)
USABLE_CLIPS: (timestamps or regions that are usable for social content, or "none" / "whole thing" for a photo)
QUALITY_FLAGS: (blur, bad lighting, shaky, awkward framing — or "none")
BRAND_RULE_RISKS: (anything in frame or implied that conflicts with the brand rules above — e.g. shows the lobster butter recipe, calls Pau "chef" on a sign, shows a discount sign — or "none")
CONTENT_PILLAR_FIT: (which of: Product / Story / Vibe / Social Proof — fits best, or "unclear")`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: createUserContent([
      createPartFromUri(active.uri, mimeType),
      prompt,
    ]),
  });

  return response.text;
}
