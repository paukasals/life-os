import { BaseAgent } from '../../shared/base-agent.js';

export class CustomerReviewMonitorAgent extends BaseAgent {
  constructor() {
    super(
      'Customer Review Monitor',
      `You are a customer experience analyst. You monitor reviews across Google, Trustpilot,
and other platforms. You identify recurring complaints, celebrate positive themes, detect
reputation risks early, and draft response suggestions for negative reviews.`
    );
  }

  async run() {
    this.log('Scanning customer reviews...');
    const reviews = await this.fetchNewReviews();

    if (reviews.length === 0) {
      this.log('No new reviews today.');
      return null;
    }

    const response = await this.think(
      `New reviews since last check: ${JSON.stringify(reviews, null, 2)}

Summarize sentiment, highlight any urgent negative reviews requiring a response,
identify recurring themes, and draft a reply for the most critical negative review if any.`
    );

    const summary = response.content[0].text;
    this.log(summary);

    const hasNegative = reviews.some((r) => r.rating <= 2);
    await this.notify(summary, hasNegative ? 'both' : 'telegram');

    return summary;
  }

  async fetchNewReviews() {
    // TODO: integrate Google Places API + Trustpilot API
    return [];
  }
}
