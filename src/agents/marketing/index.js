import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class MarketingAgent extends BaseAgent {
  constructor() {
    super(
      'Marketing',
      `You are the growth strategist for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Channels: Google Ads (local search), Meta (location-based, seasonal), organic social (TikTok, Instagram).
Campaigns: Customer acquisition (new diners), frequency (repeat visits), seasonal specials, word-of-mouth.
Metrics: CAC, repeat rate, AOV, brand awareness, foot traffic.

Your role: track ad performance, optimize spend, identify growth levers, celebrate wins.`
    );
  }

  async run() {
    this.log('Starting daily marketing review...');
    const metrics = await this.fetchMetrics();

    // If no data (not integrated), skip Claude analysis
    if (!metrics || Object.keys(metrics).length === 0) {
      this.log('Marketing system not yet integrated. Waiting for terminal session connection...');
      return null;
    }

    const prompt = `
Marketing metrics for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(metrics, null, 2)}

Provide:
1. **Performance**: Best-performing channel/campaign
2. **Opportunity**: Underperforming area to fix
3. **ROI**: Spend efficiency summary
4. **One Action**: Top marketing priority today

Be concise and action-focused.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`🎯 *Marketing Report*\n${summary}`, 'telegram');
    return summary;
  }

  async fetchMetrics() {
    // TODO: Integrate with your separate Marketing Claude Code session (terminal)
    // Option 1: REST API endpoint (if Marketing system exposes an API)
    //   - Example: const data = await fetch('http://localhost:3001/metrics').then(r => r.json())
    //   - Or: const data = await fetch('https://marketing-system.railway.app/metrics').then(r => r.json())
    //
    // Option 2: Direct import (if sharing the same codebase)
    //   - import { getMarketingMetrics } from './path/to/marketing-module'
    //   - const metrics = await getMarketingMetrics()
    //
    // Option 3: File-based cache
    //   - Write Marketing system output to a JSON file
    //   - Read that file here: const metrics = JSON.parse(fs.readFileSync('./data/marketing-metrics.json'))
    //
    // For now, returning null signals "not yet integrated"
    
    return {
      google: { spend: 0, clicks: 0, conversions: 0, cac: 0 },
      meta: { spend: 0, reach: 0, engagements: 0, cpc: 0 },
      organic: { followers: 0, engagement_rate: 0, topPost: '' },
      date: new Date().toISOString().split('T')[0],
    };
  }
}

