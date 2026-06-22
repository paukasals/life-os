import { BaseAgent } from '../../shared/base-agent.js';

export class InventoryAgent extends BaseAgent {
  constructor() {
    super(
      'Inventory',
      `You are an inventory management expert. You track stock levels, identify low-stock items,
flag overstock risks, suggest reorder quantities based on sales velocity, and alert on
supply chain issues. Prioritize preventing stockouts on high-velocity SKUs.`
    );
  }

  async run() {
    this.log('Checking inventory levels...');
    const inventory = await this.fetchInventory();

    const response = await this.think(
      `Current inventory: ${JSON.stringify(inventory, null, 2)}

Identify items needing immediate reorder, overstock risks, and one operational recommendation.`
    );

    const summary = response.content[0].text;
    this.log(summary);

    if (inventory.lowStockItems?.length > 0) {
      await this.notify(`ALERT: Low stock detected!\n${summary}`, 'both');
    } else {
      await this.notify(summary, 'telegram');
    }

    return summary;
  }

  async fetchInventory() {
    // TODO: integrate with your inventory management system (Shopify, WooCommerce, custom)
    return {
      totalSKUs: 0,
      lowStockItems: [],
      outOfStockItems: [],
      overstockItems: [],
      date: new Date().toISOString().split('T')[0],
    };
  }
}
