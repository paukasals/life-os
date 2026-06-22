import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class RevenueDashboardAgent extends BaseAgent {
  constructor() {
    super(
      'Revenue Dashboard',
      `You are the revenue analyst for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Revenue streams:
- Lobsteria: Airstream food truck (direct sales, catering)
- The Crepes & Waffles Bar: Walk-in, events, catering

Your role: track daily revenue, identify high-performers, spot trends, flag opportunities to scale.
Focus on: ticket size, frequency, seasonal patterns, and profit margin by product.`
    );
  }

  async run() {
    this.log('Building revenue snapshot...');
    const data = await this.fetchRevenueData();

    const prompt = `
Revenue snapshot for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(data, null, 2)}

Provide:
1. **Today's Performance**: Revenue vs forecast
2. **MTD Progress**: On track to target?
3. **Top Performer**: Best-selling product/location
4. **One Opportunity**: Single action to boost revenue this week

Be strategic and concise.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`💰 *Revenue Dashboard*\n${summary}`, 'telegram');
    return { summary, data };
  }

  async fetchRevenueData() {
    // TODO: aggregate from Stripe, Square, Shopify, or POS system
    return {
      lobsteria: {
        todayRevenue: 0,
        mtdRevenue: 0,
        topProduct: 'Lobster Roll',
      },
      crepeswaffles: {
        todayRevenue: 0,
        mtdRevenue: 0,
        topProduct: 'Classic Waffle',
      },
      combined: {
        mtdTarget: 0,
        avgOrderValue: 0,
        transactionCount: 0,
      },
      date: new Date().toISOString().split('T')[0],
    };
  }
}

