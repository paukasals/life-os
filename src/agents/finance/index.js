import { BaseAgent } from '../../shared/base-agent.js';
import { formatCurrency } from '../../shared/utils.js';

export class FinanceAgent extends BaseAgent {
  constructor() {
    super(
      'Finance',
      `You are a CFO-level financial analyst. You monitor cash flow, expenses, revenue trends,
and financial health. You flag unusual transactions, project runway, track budgets vs actuals,
and alert on anomalies. Be precise with numbers and proactive about risks.`
    );
  }

  async run() {
    this.log('Starting financial snapshot...');
    const data = await this.fetchFinancials();

    const response = await this.think(
      `Current financial data: ${JSON.stringify(data, null, 2)}

Provide a daily financial snapshot: cash position, burn rate, MoM revenue change, one risk or opportunity.`
    );

    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(summary, 'telegram');
    return { summary, data };
  }

  async fetchFinancials() {
    // TODO: integrate Stripe + bank API
    return {
      cashBalance: 0,
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      outstandingInvoices: 0,
      date: new Date().toISOString().split('T')[0],
    };
  }
}
