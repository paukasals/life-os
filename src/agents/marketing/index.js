import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_DIR = path.resolve(__dirname, '../../knowledge/marketing');

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
    const knowledge = await this.loadKnowledgeBase();

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

  async loadKnowledgeBase() {
    try {
      const entries = await fs.readdir(KNOWLEDGE_DIR, { withFileTypes: true });
      const sections = [];

      // Load key-decisions.md first as high-priority context when present
      try {
        const keyPath = path.join(KNOWLEDGE_DIR, 'key-decisions.md');
        const keyText = await fs.readFile(keyPath, 'utf-8');
        const keyExcerpt = keyText.trim().slice(0, 14000);
        sections.push(`### key-decisions.md\n${keyExcerpt}`);
      } catch (e) {
        // no key-decisions.md present — continue
      }

      const markdownFiles = entries
        .filter((entry) => entry.isFile() && ['.md', '.txt'].includes(path.extname(entry.name).toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name));

      for (const entry of markdownFiles) {
        const filePath = path.join(KNOWLEDGE_DIR, entry.name);
        const text = await fs.readFile(filePath, 'utf-8');
        const excerpt = text.trim().slice(0, 14000);
        sections.push(`### ${entry.name}\n${excerpt}`);
      }

      const reviewFile = entries.find((entry) => entry.isFile() && entry.name === 'gbp_reviews_data.json');
      if (reviewFile) {
        sections.push(await this.loadGBPReviewSummary(path.join(KNOWLEDGE_DIR, reviewFile.name)));
      }

      sections.push(await this.loadSessionKnowledge());
      return sections.join('\n\n');
    } catch (err) {
      this.log(`Could not load marketing knowledge base: ${err.message}`);
      return 'No Lobsteria marketing knowledge base available.';
    }
  }

  async loadGBPReviewSummary(reviewPath) {
    try {
      const raw = await fs.readFile(reviewPath, 'utf-8');
      const reviews = JSON.parse(raw);
      if (!Array.isArray(reviews)) return 'GBP review dataset is unavailable or malformed.';

      const counts = reviews.reduce((acc, review) => {
        const rating = review.starRating || 'UNKNOWN';
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
      }, {});

      const comments = reviews
        .filter((review) => typeof review.comment === 'string' && review.comment.trim().length > 0)
        .slice(0, 20);

      const positive = comments.filter((review) => ['FIVE', 'FOUR'].includes(review.starRating)).slice(0, 5);
      const negative = comments.filter((review) => ['ONE', 'TWO', 'THREE'].includes(review.starRating)).slice(0, 5);

      const summaryLines = [
        '### gbp_reviews_data.json — Google Business Profile review summary',
        `Total reviews: ${reviews.length}`,
        `Stars: ${Object.entries(counts).map(([star, count]) => `${star}: ${count}`).join(', ')}`,
        'Top positive review snippets:',
        ...positive.map((review, idx) => `${idx + 1}. ${review.comment.trim().slice(0, 180)}`),
        'Top negative review snippets:',
        ...negative.map((review, idx) => `${idx + 1}. ${review.comment.trim().slice(0, 180)}`),
      ];

      return summaryLines.join('\n');
    } catch (err) {
      this.log(`Could not load GBP review summary: ${err.message}`);
      return 'GBP review summary unavailable.';
    }
  }

  async loadSessionKnowledge() {
    try {
      const sessionsDir = path.join(KNOWLEDGE_DIR, 'sessions');
      const entries = await fs.readdir(sessionsDir, { withFileTypes: true });
      const sessionContents = [];

      const historyFile = entries.find((entry) => entry.isFile() && entry.name === 'history.jsonl');
      if (historyFile) {
        const raw = await fs.readFile(path.join(sessionsDir, historyFile.name), 'utf-8');
        const lines = raw.split(/\r?\n/).filter(Boolean).slice(0, 150);
        const historyNotes = lines
          .map((line, idx) => {
            try {
              const obj = JSON.parse(line);
              if (obj.display) return `${idx + 1}. ${obj.display}`;
              return null;
            } catch {
              return null;
            }
          })
          .filter(Boolean);
        if (historyNotes.length) {
          sessionContents.push('### history.jsonl — Claude desktop session history');
          sessionContents.push(historyNotes.slice(0, 20).join('\n'));
        }
      }

      const sessionFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json') && entry.name !== 'history.jsonl');
      for (const sessionFile of sessionFiles) {
        const raw = await fs.readFile(path.join(sessionsDir, sessionFile.name), 'utf-8');
        const data = JSON.parse(raw);
        const lines = [];
        if (data.display) lines.push(`display: ${data.display}`);
        if (data.cwd) lines.push(`cwd: ${data.cwd}`);
        if (data.entrypoint) lines.push(`entrypoint: ${data.entrypoint}`);
        if (data.startedAt) lines.push(`startedAt: ${data.startedAt}`);
        if (data.version) lines.push(`version: ${data.version}`);
        if (lines.length) {
          sessionContents.push(`### sessions/${sessionFile.name}`);
          sessionContents.push(lines.join(' | '));
        }
      }

      if (sessionContents.length === 0) {
        return 'No Claude session knowledge available.';
      }

      return sessionContents.join('\n\n');
    } catch (err) {
      this.log(`Could not load Claude session knowledge: ${err.message}`);
      return 'Claude session knowledge unavailable.';
    }
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

