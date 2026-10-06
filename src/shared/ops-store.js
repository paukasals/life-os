import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

async function readJson(filename, fallback) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filename, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

export const linePrepStore = {
  all: () => readJson('line-prep.json', []),
  save: (items) => writeJson('line-prep.json', items),
};

export const cleaningStore = {
  all: () => readJson('cleaning-tasks.json', []),
  save: (items) => writeJson('cleaning-tasks.json', items),
};

export const recipeStore = {
  all: () => readJson('recipes.json', []),
};

export const inventoryCountsStore = {
  all: () => readJson('inventory-counts.json', []),

  async append(entry) {
    const arr = await readJson('inventory-counts.json', []);
    arr.push(entry);
    await writeJson('inventory-counts.json', arr);
    return entry;
  },

  // Most recent counted quantity per line-prep item id.
  async latestCountMap() {
    const arr = await readJson('inventory-counts.json', []);
    const map = {};
    for (const c of arr) {
      map[c.itemId] = { qty: c.qty, countedAt: c.countedAt, countedBy: c.countedBy };
    }
    return map;
  },
};
