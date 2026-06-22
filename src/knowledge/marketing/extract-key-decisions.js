import { promises as fs } from 'fs';
import path from 'path';

const KNOWLEDGE_DIR = path.resolve('src/knowledge/marketing');
const SESSIONS_DIR = path.join(KNOWLEDGE_DIR, 'sessions');
const HISTORY_FILE = path.join(SESSIONS_DIR, 'history.jsonl');
const OUTPUT_FILE = path.join(KNOWLEDGE_DIR, 'key-decisions.md');

const KEY_TERMS = [
  'marketing',
  'brand',
  'strategy',
  'social',
  'campaign',
  'GBP',
  'review',
  'tiktok',
  'content',
  'decision',
  'action',
  'recommendation',
  'priority',
  'brief',
];

const BLACKLIST_PATTERNS = [
  /init this as a node\.js project/i,
  /git repo/i,
  /push to github/i,
  /send a test message/i,
  /token:/i,
  /chat_id:/i,
  /anthropic api key/i,
  /add my anthropic api key/i,
  /ls ~\/pau-life-os/i,
  /now\??$/i,
  /whats the username\?/i,
  /clear/i,
];

function isRelevant(text) {
  const normalized = text.toLowerCase();
  return KEY_TERMS.some((term) => normalized.includes(term));
}

function isBlacklisted(text) {
  return BLACKLIST_PATTERNS.some((pattern) => pattern.test(text));
}

function extractTextFromHistoryLine(line) {
  try {
    const obj = JSON.parse(line);
    const parts = [];
    if (typeof obj.display === 'string') parts.push(obj.display.trim());
    if (typeof obj.pastedContents === 'object' && obj.pastedContents !== null) {
      const pasted = JSON.stringify(obj.pastedContents);
      if (pasted && pasted !== '{}') parts.push(pasted);
    }
    return parts.join(' ');
  } catch {
    return null;
  }
}

async function main() {
  try {
    const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const relevant = lines
      .map(extractTextFromHistoryLine)
      .filter(Boolean)
      .filter(isRelevant)
      .filter((text) => !isBlacklisted(text))
      .map((text) => `- ${text}`);

    const content = [];
    content.push('# Lobsteria Marketing Key Decisions from Session History');
    content.push('Generated from `src/knowledge/marketing/sessions/history.jsonl`.');
    content.push('');

    if (relevant.length === 0) {
      content.push('No explicit Lobsteria marketing decisions, strategies, or action items were found in the current session history file.');
      content.push('The session history contains project setup, environment initialization, and developer commands, but not marketing-specific recommendations.');
      content.push('');
      content.push('For now, the marketing agent can rely on the imported Lobsteria brand knowledge documents and will update this file automatically when future marketing session commands become available.');
    } else {
      content.push('## Extracted Insights');
      content.push('');
      content.push(...relevant);
    }

    await fs.writeFile(OUTPUT_FILE, content.join('\n'), 'utf-8');
    console.log(`Wrote ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Failed to extract key decisions:', err.message);
    process.exit(1);
  }
}

main();
