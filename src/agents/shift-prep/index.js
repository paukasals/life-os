import { BaseAgent } from '../../shared/base-agent.js';
import { getTodaysPrepPlan, getTodaysCleaning } from '../../shared/shift-ops.js';

// Deterministic — no LLM call. Tonight's inventory counts vs. par levels
// decide tomorrow's prep list, so this stays a straight calculation rather
// than something an LLM could get wrong.
export class ShiftPrepAgent extends BaseAgent {
  constructor() {
    super('Shift Prep', '');
  }

  async run() {
    this.log('Computing tomorrow\'s prep plan...');
    const [plan, cleaning] = await Promise.all([getTodaysPrepPlan(), getTodaysCleaning()]);

    const lines = [`📋 *Prep plan for ${plan.date}*`];

    if (plan.items.length === 0) {
      lines.push('Nothing short vs. par from the last count (or no counts logged yet).');
    } else {
      lines.push(`${plan.items.length} items short · ~${plan.totalMinutes} min budgeted · start by ${plan.suggestedStartTime} for ${plan.openTime} open`);
      for (const item of plan.items.slice(0, 15)) {
        lines.push(`• ${item.name} — ${item.gap} ${item.unit}${item.minutesNeeded != null ? ` (~${item.minutesNeeded}m)` : ' (time TBD)'}`);
      }
      if (plan.items.length > 15) lines.push(`...and ${plan.items.length - 15} more.`);
    }

    if (plan.incomplete) {
      lines.push('⚠️ Some items are missing a par level or time estimate — budget above is incomplete.');
    }
    if (plan.uncountedItems.length > 0) {
      lines.push(`⚠️ No count on file for ${plan.uncountedItems.length} item(s) — they're excluded until counted.`);
    }

    if (cleaning.length > 0) {
      lines.push('', `🧹 *Cleaning due today*: ${cleaning.map((t) => t.name).join(', ')}`);
    }

    const summary = lines.join('\n');
    this.log(summary);
    await this.notify(summary, 'telegram');
    return summary;
  }
}
