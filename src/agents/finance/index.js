import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';
import { quickbooksService } from '../../shared/quickbooks.js';

// Each business is tracked in its own QuickBooks Online company; map business name
// to the key its tokens are stored under (see setup-quickbooks.js).
const QUICKBOOKS_BUSINESS_KEYS = {
  Lobsteria: 'lobsteria',
  'The Crepes & Waffles Bar': 'crepeswaffles',
};

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

    // If no business has a QuickBooks connection yet, skip Claude analysis
    if (!data.connected) {
      this.log('QuickBooks not yet connected for any business. Run: node setup-quickbooks.js <business>');
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
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = monthStart.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    const data = {
      lobsteria: { revenue: 0, expenses: 0, margin: 0, cashBalance: 0, connected: false },
      crepeswaffles: { revenue: 0, expenses: 0, margin: 0, cashBalance: 0, connected: false },
      combined: {
        cashBalance: 0,
        monthlyRevenue: 0,
        monthlyExpenses: 0,
        runway: 0,
      },
      date: endDate,
      connected: false,
    };

    for (const business of userProfile.businesses) {
      const key = QUICKBOOKS_BUSINESS_KEYS[business.name];
      if (!key) continue;

      const configured = await quickbooksService.isConfigured(key);
      if (!configured) continue;

      try {
        const [pnl, balance] = await Promise.all([
          quickbooksService.getProfitAndLoss(key, startDate, endDate),
          quickbooksService.getBalanceSheet(key, endDate),
        ]);

        const revenue = pnl.Income || 0;
        const expenses = (pnl.COGS || 0) + (pnl.Expenses || 0);
        const netIncome = pnl.NetIncome ?? (revenue - expenses);
        const cashBalance = balance.BankAccounts || 0;

        data[key] = {
          revenue,
          expenses,
          margin: revenue > 0 ? Number(((netIncome / revenue) * 100).toFixed(2)) : 0,
          cashBalance,
          connected: true,
        };
        data.connected = true;
        data.combined.cashBalance += cashBalance;
        data.combined.monthlyRevenue += revenue;
        data.combined.monthlyExpenses += expenses;
      } catch (err) {
        this.error(`QuickBooks fetch failed for "${key}"`, err);
      }
    }

    // Rough runway estimate: cash on hand / projected full-month burn, based on
    // how much of the current month has elapsed.
    const daysElapsed = Math.max(1, Math.round((today - monthStart) / 86400000) + 1);
    const projectedMonthlyExpenses = (data.combined.monthlyExpenses / daysElapsed) * 30;
    data.combined.runway = projectedMonthlyExpenses > 0
      ? Number((data.combined.cashBalance / projectedMonthlyExpenses).toFixed(1))
      : 0;

    return data;
  }
}

