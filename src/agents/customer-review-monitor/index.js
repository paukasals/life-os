import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';
import { loadMarketingKnowledge } from '../../shared/marketing-knowledge.js';
import { autopilotMode } from '../../shared/autopilot.js';
import * as gbp from '../../integrations/google-business-profile.js';

const CHANNEL = 'reviews';
const RATING_VALUE = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJsonArray(text) {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('No JSON array found in model response');
  return JSON.parse(match[0]);
}

export class CustomerReviewMonitorAgent extends BaseAgent {
  constructor() {
    super(
      'Review Responder',
      `You write Google Business Profile review replies for ${userProfile.businesses.map(b => b.name).join(' & ')}, in the owner Pau's voice.

Tone: warm, specific, never generic corporate boilerplate. Reference what the reviewer actually said (a dish, a detail, a language they wrote in — reply in kind for Spanish reviews). Keep replies short (2-3 sentences, under ~350 characters).

For 1-3 star reviews: acknowledge the specific issue, apologize genuinely, and invite them to reach out directly (use the contact info in the knowledge base if present) so it can be made right. Never get defensive.

For 4-5 star reviews with no text: use a short, varied, on-brand thank-you — never robotic or repetitive across replies.`
    );
  }

  async run() {
    if (!gbp.isConfigured()) {
      this.log('GBP credentials not configured — skipping (set GBP_CLIENT_ID/GBP_CLIENT_SECRET/GBP_REFRESH_TOKEN).');
      return null;
    }

    this.log('Fetching unanswered Google reviews...');
    const reviews = await gbp.fetchUnansweredReviews();

    if (reviews.length === 0) {
      this.log('No new reviews to respond to.');
      return null;
    }

    this.log(`${reviews.length} review(s) need a reply. Drafting...`);
    const knowledge = await loadMarketingKnowledge((msg) => this.log(msg));
    const drafts = await this.draftReplies(reviews, knowledge);

    const mode = autopilotMode(CHANNEL);
    let posted = 0;
    let errors = 0;

    if (mode === 'live') {
      for (const draft of drafts) {
        try {
          await gbp.postReviewReply(draft.reviewId, draft.reply);
          posted += 1;
        } catch (err) {
          errors += 1;
          this.error(`Failed to post reply for review ${draft.reviewId}`, err);
        }
        await sleep(500); // stay well under GBP's rate limit
      }
    }

    const summary = this.formatSummary(reviews, drafts, mode, posted, errors);
    this.log(summary);
    await this.notify(`⭐ *Review Responder*\n${summary}`, 'telegram');
    return summary;
  }

  async draftReplies(reviews, knowledge) {
    const reviewPayload = reviews.map((r) => ({
      reviewId: r.reviewId,
      reviewer: r.reviewer?.displayName || 'Guest',
      rating: r.starRating,
      comment: (r.comment || '').trim(),
    }));

    // Batch to stay well within a single response's output budget — a
    // review backlog can run into the hundreds.
    const BATCH_SIZE = 12;
    const drafts = [];

    for (let i = 0; i < reviewPayload.length; i += BATCH_SIZE) {
      const batch = reviewPayload.slice(i, i + BATCH_SIZE);
      const prompt = `
Lobsteria marketing & brand knowledge:
${knowledge}

Unanswered Google reviews (JSON):
${JSON.stringify(batch, null, 2)}

Write one reply per review. Respond with ONLY a JSON array, no prose, no markdown fences, in this exact shape:
[{"reviewId": "...", "reply": "..."}]

Every reviewId from the input must appear exactly once in the output.`;

      const response = await this.think(prompt);
      const text = response.content[0].text;

      try {
        const parsed = extractJsonArray(text);
        const byId = new Map(parsed.map((d) => [d.reviewId, d.reply]));
        for (const r of batch) {
          if (byId.has(r.reviewId)) {
            drafts.push({ reviewId: r.reviewId, reviewer: r.reviewer, rating: r.rating, reply: byId.get(r.reviewId) });
          }
        }
      } catch (err) {
        this.error(`Failed to parse drafted replies for batch starting at ${i}`, err);
      }
    }

    return drafts;
  }

  formatSummary(reviews, drafts, mode, posted, errors) {
    const negativeCount = reviews.filter((r) => (RATING_VALUE[r.starRating] || 5) <= 3).length;
    const preview = drafts
      .slice(0, 5)
      .map((d) => `• ${d.reviewer} (${d.rating}): "${d.reply.slice(0, 140)}"`)
      .join('\n');

    const header = mode === 'live'
      ? `Posted ${posted}/${drafts.length} replies live${errors ? ` (${errors} failed)` : ''}.`
      : `Drafted ${drafts.length} replies — dry-run, nothing posted (set MARKETING_AUTOPILOT_REVIEWS=live to auto-post).`;

    return [
      header,
      `${negativeCount} of these are 3★ or below and need a human read before ${mode === 'live' ? 'anything further' : 'going live'}.`,
      drafts.length ? `\nPreview:\n${preview}` : '',
    ].join('\n');
  }
}
