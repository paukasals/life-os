import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';
import { loadMarketingKnowledge } from '../../shared/marketing-knowledge.js';
import { autopilotMode } from '../../shared/autopilot.js';
import * as ads from '../../integrations/ad-platforms.js';

const CHANNEL = 'ads';

export class AdsManagerAgent extends BaseAgent {
  constructor() {
    super(
      'Ads Manager',
      `You manage paid ad spend for ${userProfile.businesses.map(b => b.name).join(' & ')} across Google Ads and Meta.

Guardrails are enforced in code, not by you: a campaign is only ever auto-paused when its CAC breaches
AD_MAX_CAC, and budgets are never auto-increased by this system. Your job is to explain performance and
recommend the next move for Pau to approve — not to decide spend changes yourself.`
    );
  }

  async run() {
    this.log('Pulling ad performance...');
    const [meta, google] = await Promise.all([
      ads.isMetaConfigured() ? ads.fetchMetaInsights() : null,
      ads.isGoogleAdsConfigured() ? ads.fetchGoogleAdsMetrics() : null,
    ]);

    if (!meta && !google) {
      this.log('No ad platform credentials configured (META_ACCESS_TOKEN/META_AD_ACCOUNT_ID or GOOGLE_ADS_* vars) — nothing to manage yet.');
      return null;
    }

    const mode = autopilotMode(CHANNEL);
    const guardrailActions = mode === 'live' ? await this.enforceGuardrails(meta, google) : [];

    const knowledge = await loadMarketingKnowledge((msg) => this.log(msg));
    const prompt = `
Lobsteria marketing & brand knowledge:
${knowledge}

Meta Ads (last 7 days): ${JSON.stringify(meta)}
Google Ads (last 7 days): ${JSON.stringify(google)}
Guardrail actions taken automatically this run: ${JSON.stringify(guardrailActions)}

Provide:
1. **Performance**: best/worst campaign by CAC
2. **Spend efficiency**: is spend proportional to results?
3. **Recommendation**: one specific budget or targeting change for Pau to approve (this system never auto-scales budget up)
4. **Guardrail note**: acknowledge any auto-pause above, or confirm none were needed

Be concise and specific — cite real numbers from the data above.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`💰 *Ads Manager*\n${summary}`, 'telegram');
    return summary;
  }

  // The only live action this agent ever takes on its own: pausing a
  // campaign whose trailing CAC has breached an explicit, human-set ceiling.
  // No budget increases, no reallocation — those stay recommend-only above.
  async enforceGuardrails(meta, google) {
    const maxCac = process.env.AD_MAX_CAC ? Number(process.env.AD_MAX_CAC) : null;
    if (!maxCac) return [];

    const actions = [];
    const candidates = [
      ...(meta?.campaigns || []).map((c) => ({ ...c, platform: 'meta' })),
      ...(google?.campaigns || []).map((c) => ({ ...c, platform: 'google' })),
    ];

    for (const c of candidates) {
      if (c.cac != null && c.cac > maxCac && c.spend > 0) {
        try {
          if (c.platform === 'meta') await ads.pauseMetaCampaign(c.campaignId);
          else await ads.pauseGoogleAdsCampaign(c.campaignId);

          actions.push({
            platform: c.platform,
            campaignId: c.campaignId,
            name: c.name,
            cac: c.cac,
            action: 'paused',
            reason: `CAC $${c.cac.toFixed(2)} > AD_MAX_CAC $${maxCac}`,
          });
          this.log(`Auto-paused ${c.platform} campaign "${c.name}" — CAC $${c.cac.toFixed(2)} > $${maxCac}`);
        } catch (err) {
          this.error(`Failed to auto-pause ${c.platform} campaign ${c.campaignId}`, err);
        }
      }
    }

    return actions;
  }
}
