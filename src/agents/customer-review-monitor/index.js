import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class CustomerReviewMonitorAgent extends BaseAgent {
  constructor() {
    super(
      'Customer Review Monitor',
      `You are the CX analyst for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Monitor: Google, Yelp, Instagram DMs, TikTok comments for food truck and bar.
Focus: Fresh seafood quality, service speed, food safety, atmosphere, pricing feedback.
Action: Respond to issues quickly, celebrate raves, identify improvement areas.`
    );
  }

  async run() {
    this.log('Scanning customer reviews...');
    const reviews = await this.fetchNewReviews();

    if (reviews.length === 0) {
      this.log('No new reviews today.');
      return null;
    }

    const prompt = `
New reviews for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(reviews, null, 2)}

Provide:
1. **Sentiment Summary**: Overall theme from reviews
2. **Highlights**: What's working (food, service, vibe)
3. **Gaps**: Recurring complaints or opportunities
4. **Response Draft**: Reply to most critical feedback

Be warm, authentic, and action-oriented.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);

    const hasNegative = reviews.some((r) => r.rating <= 2);
    await this.notify(`⭐ *Customer Feedback*\n${summary}`, 'telegram');

    return summary;
  }

  async fetchNewReviews() {
    // TODO: integrate Google Places API, Yelp API, social listening
    return [];
  }
}

