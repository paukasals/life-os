import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class FinanceAgent extends BaseAgent {
  constructor() {
    super(
      'Finance',
      `You are the CFO for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Track: Daily revenue, expenses (food cost, labor, truck maintenance, rent), cash reserves, seasonal trends.
Focus: Profitability by location/menu item, cost control, growth reinvestment, tax planning.
Alert: Unusual transactions, low cash, opportunities to improve margins.

Be precise with numbers and proactive about runway.`
    );
  }

  async run() {
    this.log('Starting financial snapshot...');
    const data = await this.fetchFinancials();

    // If no data (not integrated), skip Claude analysis
    if (!data || Object.keys(data).length === 0) {
      this.log('Finance system not yet integrated. Waiting for cloud system connection...');
      return null;
    }

    const prompt = `
Financial snapshot for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(data, null, 2)}

Provide:
1. **Cash Position**: Available capital today
2. **Daily Performance**: Revenue vs forecast
3. **Margin Check**: Any cost concerns?
4. **One Opportunity**: Action to improve profitability

Be precise and strategic.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`💵 *Finance Report*\n${summary}`, 'telegram');
    return { summary, data };
  }

  async fetchFinancials() {
    // TODO: Integrate with your separate Finance Claude Code session
    // Option 1: REST API endpoint
    //   - If your Finance system exposes an API, call it here
    //   - Example: const data = await fetch('https://finance-system.railway.app/snapshot').then(r => r.json())
    // 
    // Option 2: Direct import (if sharing the same codebase)
    //   - import { getFinanceSnapshot } from './path/to/finance-module'
    //   - const data = await getFinanceSnapshot()
    //
    // Option 3: Webhook-based
    //   - Subscribe to webhooks from your Finance system
    //   - Store latest data in cache/state
    //
    // For now, returning null signals "not yet integrated"
    
    return {
      lobsteria: { revenue: 0, expenses: 0, margin: 0 },
      crepeswaffles: { revenue: 0, expenses: 0, margin: 0 },
      combined: {
        cashBalance: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        runway: 0,
      },
      date: new Date().toISOString().split('T')[0],
    };
  }
}

