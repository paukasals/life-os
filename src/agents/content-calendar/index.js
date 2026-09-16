import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';
import { loadMarketingKnowledge } from '../../shared/marketing-knowledge.js';
import { autopilotMode } from '../../shared/autopilot.js';
import * as tiktok from '../../integrations/tiktok.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const QUEUE_PATH = path.resolve(__dirname, '../../data/content-queue.json');
const CHANNEL = 'social';

async function readQueue() {
  try {
    const raw = await fs.readFile(QUEUE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function writeQueue(queue) {
  await fs.mkdir(path.dirname(QUEUE_PATH), { recursive: true });
  await fs.writeFile(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('No JSON object found in model response');
  return JSON.parse(match[0]);
}

export class ContentCalendarAgent extends BaseAgent {
  constructor() {
    super(
      'Content Calendar',
      `You are the content strategist and copywriter for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Channels: TikTok (food prep, behind-the-scenes), Instagram (photos/Reels), LinkedIn (entrepreneur journey).
Content angles: Fresh ingredients, Airstream culture, seasonal specials, customer stories, water polo (personal brand).

You maintain posting cadence, write platform-native captions, and flag gaps. You do not shoot footage — Pau
drops finished media into the content queue with a public URL and a one-line idea; you turn that into a
caption/hashtags on-brand and publishable, and flag when the queue is running dry.`
    );
  }

  async run() {
    this.log('Reviewing content calendar and queue...');
    const queue = await readQueue();
    const knowledge = await loadMarketingKnowledge((msg) => this.log(msg));

    const gapAnalysis = await this.analyzeGaps(queue, knowledge);
    const publishResult = await this.publishNextQueued(queue, knowledge);

    const summary = [gapAnalysis, publishResult ? `\n${publishResult}` : ''].join('\n').trim();
    this.log(summary);
    await this.notify(`📱 *Content Calendar*\n${summary}`, 'telegram');
    return summary;
  }

  async analyzeGaps(queue, knowledge) {
    const today = new Date().toISOString().split('T')[0];
    const readyCount = queue.filter((item) => item.status === 'ready').length;
    const postedRecent = queue.filter((item) => item.status === 'posted').slice(-7);

    const prompt = `
Lobsteria marketing & brand knowledge:
${knowledge}

Content queue snapshot (today is ${today}):
- Items ready to post: ${readyCount}
- Recently posted: ${JSON.stringify(postedRecent.map((i) => ({ platform: i.platform, postedAt: i.postedAt, idea: i.idea })))}

Provide:
1. **7-Day Gap**: Is the ready queue thin? Which platform needs fresh footage from Pau?
2. **Content Idea**: One specific post idea to fill the biggest gap
3. **Platform Focus**: Which channel needs attention this week

Keep it short, creative, and platform-native.`;

    const response = await this.think(prompt);
    return response.content[0].text;
  }

  async publishNextQueued(queue, knowledge) {
    const today = new Date().toISOString().split('T')[0];
    const next = queue.find(
      (item) => item.status === 'ready' && item.platform === 'tiktok' && (!item.scheduledFor || item.scheduledFor <= today)
    );

    if (!next) {
      return 'Nothing queued and ready to post today.';
    }

    if (!next.caption) {
      next.caption = await this.draftCaption(next, knowledge);
    }

    const mode = autopilotMode(CHANNEL);

    if (mode !== 'live') {
      await writeQueue(queue);
      return `Drafted caption for next queued post (dry-run, not posted — set MARKETING_AUTOPILOT_SOCIAL=live to auto-post):\n"${next.caption}"`;
    }

    if (!tiktok.isConfigured()) {
      return 'Queue has a ready post but TIKTOK_ACCESS_TOKEN is not set — cannot post live.';
    }

    try {
      const result = await tiktok.postContent({
        mediaUrl: next.mediaUrl,
        caption: next.caption,
        mediaType: next.mediaType || 'PHOTO',
      });
      next.status = 'posted';
      next.postedAt = new Date().toISOString();
      next.publishId = result.publishId;
      await writeQueue(queue);
      return `Posted to TikTok (${result.privacyLevel}): "${next.caption}"`;
    } catch (err) {
      next.status = 'failed';
      next.lastError = err.message;
      await writeQueue(queue);
      this.error('TikTok publish failed', err);
      return `Failed to post queued content: ${err.message}`;
    }
  }

  async draftCaption(item, knowledge) {
    const prompt = `
Lobsteria marketing & brand knowledge:
${knowledge}

Write a TikTok caption for this queued post:
Idea: ${item.idea}
Media type: ${item.mediaType || 'PHOTO'}

Respond with ONLY a JSON object: {"caption": "..."}
Caption should be short, platform-native, include 3-5 relevant hashtags (#lobsteria, #wynwood, #miami plus content-specific ones), on-brand voice.`;

    const response = await this.think(prompt);
    try {
      const parsed = extractJson(response.content[0].text);
      return parsed.caption;
    } catch (err) {
      this.error('Failed to parse drafted caption', err);
      return response.content[0].text.trim().slice(0, 2200);
    }
  }
}
