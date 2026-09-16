import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MARKETING_KNOWLEDGE_DIR = path.resolve(__dirname, '../knowledge/marketing');

// Shared Lobsteria marketing context (brand strategy, socials, ads history,
// review data, past session notes) — loaded by every marketing sub-agent so
// they all reason from the same brief instead of duplicating this logic.
export async function loadMarketingKnowledge(logger = console.log) {
  try {
    const entries = await fs.readdir(MARKETING_KNOWLEDGE_DIR, { withFileTypes: true });
    const sections = [];

    try {
      const keyPath = path.join(MARKETING_KNOWLEDGE_DIR, 'key-decisions.md');
      const keyText = await fs.readFile(keyPath, 'utf-8');
      sections.push(`### key-decisions.md\n${keyText.trim().slice(0, 14000)}`);
    } catch (e) {
      // no key-decisions.md present — continue
    }

    const markdownFiles = entries
      .filter((entry) => entry.isFile() && ['.md', '.txt'].includes(path.extname(entry.name).toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of markdownFiles) {
      const filePath = path.join(MARKETING_KNOWLEDGE_DIR, entry.name);
      const text = await fs.readFile(filePath, 'utf-8');
      sections.push(`### ${entry.name}\n${text.trim().slice(0, 14000)}`);
    }

    const reviewFile = entries.find((entry) => entry.isFile() && entry.name === 'gbp_reviews_data.json');
    if (reviewFile) {
      sections.push(await loadGBPReviewSummary(path.join(MARKETING_KNOWLEDGE_DIR, reviewFile.name), logger));
    }

    sections.push(await loadSessionKnowledge(logger));
    return sections.join('\n\n');
  } catch (err) {
    logger(`Could not load marketing knowledge base: ${err.message}`);
    return 'No Lobsteria marketing knowledge base available.';
  }
}

async function loadGBPReviewSummary(reviewPath, logger) {
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
    logger(`Could not load GBP review summary: ${err.message}`);
    return 'GBP review summary unavailable.';
  }
}

async function loadSessionKnowledge(logger) {
  try {
    const sessionsDir = path.join(MARKETING_KNOWLEDGE_DIR, 'sessions');
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
    logger(`Could not load Claude session knowledge: ${err.message}`);
    return 'Claude session knowledge unavailable.';
  }
}
