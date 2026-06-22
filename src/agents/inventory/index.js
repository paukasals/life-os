import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class InventoryAgent extends BaseAgent {
  constructor() {
    super(
      'Inventory',
      `You are the inventory expert for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Key inventory items:
- Lobsteria: Fresh lobster, oysters, ceviche ingredients, seafood supplies, Airstream truck maintenance
- The Crepes & Waffles Bar: Crepe batter, waffle batter, fillings, toppings, equipment

Your role: track stock by business, prevent stockouts on high-velocity items, optimize supplier relationships, and flag cost-saving opportunities.`
    );
  }

  async run() {
    this.log('Checking inventory levels...');
    const inventory = await this.fetchInventory();

    const prompt = `
Inventory status for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(inventory, null, 2)}

Provide:
1. **Stock Alerts**: Items needing immediate reorder
2. **Overstock Risks**: Items to move or use
3. **One Action**: Top operational priority (supplier call, menu adjustment, etc.)

Be action-focused, not just reporting.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);

    if (inventory.lowStockItems?.length > 0) {
      await this.notify(`⚠️ *Inventory Alert*\n${summary}`, 'telegram');
    } else {
      await this.notify(`📦 *Inventory Check*\n${summary}`, 'telegram');
    }

    return summary;
  }

  async fetchInventory() {
    // TODO: integrate with Shopify, Square, or custom inventory system
    return {
      lobsteria: {
        lobster: { quantity: 0, unit: 'lbs', reorderLevel: 50 },
        oysters: { quantity: 0, unit: 'count', reorderLevel: 200 },
        cevichemix: { quantity: 0, unit: 'lbs', reorderLevel: 25 },
      },
      crepeswaffles: {
        crepebatter: { quantity: 0, unit: 'L', reorderLevel: 10 },
        wafflebatter: { quantity: 0, unit: 'L', reorderLevel: 10 },
        fillings: { quantity: 0, unit: 'various', reorderLevel: 20 },
      },
      lowStockItems: [],
      outOfStockItems: [],
      date: new Date().toISOString().split('T')[0],
    };
  }
}

