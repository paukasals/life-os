import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';
import { loadMarketingKnowledge } from '../../shared/marketing-knowledge.js';
import { fetchMetaInsights } from '../../integrations/ad-platforms.js';

export class MarketingAgent extends BaseAgent {
  constructor() {
    super(
      'Marketing',
      `You are the growth strategist for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Channels: Google Ads (local search), Meta (location-based, seasonal), organic social (TikTok, Instagram).
Campaigns: Customer acquisition (new diners), frequency (repeat visits), seasonal specials, word-of-mouth.
Metrics: CAC, repeat rate, AOV, brand awareness, foot traffic.

Your role: track ad performance, optimize spend, identify growth levers, celebrate wins. You sit above the
Review Responder, Content Calendar, and Ads Manager agents — synthesize what they're doing into one weekly view.`
    );
  }

  async run() {
    this.log('Starting daily marketing review...');
    const metrics = await this.fetchMetrics();
    const knowledge = await loadMarketingKnowledge((msg) => this.log(msg));

    const hasMetrics = metrics && Object.keys(metrics).length > 0;
    const prompt = `
Marketing context for Lobsteria & The Crepes & Waffles Bar:
${knowledge}

Marketing metrics:
${JSON.stringify(metrics, null, 2)}

Using Lobsteria-specific brand strategy, social strategy, content calendar, and marketing playbook above, provide:
1. **Performance**: Best-performing channel or campaign focus
2. **Opportunity**: Highest-leverage area to improve this week
3. **ROI**: Spend efficiency summary or value-for-effort assessment
4. **One Action**: Top marketing priority for Lobsteria today

If metrics are missing or zero, still give Lobsteria-specific recommendations based on the knowledge base rather than generic suggestions.

  Use Lobsteria key decisions and historical marketing action items when available from the knowledge base.

Be concise and action-focused.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`🎯 *Marketing Report*\n${summary}`, 'telegram');
    return summary;
  }

  async fetchMetrics() {
    const meta = await fetchMetaInsights();
    return {
      google: { spend: 0, clicks: 0, conversions: 0, cac: 0 },
      meta: meta || { spend: 0, reach: 0, engagements: 0, cpc: 0 },
      organic: { followers: 0, engagement_rate: 0, topPost: '' },
      date: new Date().toISOString().split('T')[0],
    };
  }
}
