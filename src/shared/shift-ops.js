import { linePrepStore, cleaningStore, recipeStore, inventoryCountsStore } from './ops-store.js';

const DEFAULT_OPEN_TIME = '17:00'; // Lobsteria opens 5pm daily
const DEFAULT_BUFFER_MINUTES = 30; // cushion before doors open

// Tonight's inventory count vs. par level -> tomorrow's prep list, with a
// suggested prep-start time worked backward from opening.
export async function getTodaysPrepPlan({ openTime = DEFAULT_OPEN_TIME, bufferMinutes = DEFAULT_BUFFER_MINUTES } = {}) {
  const [items, counts] = await Promise.all([linePrepStore.all(), inventoryCountsStore.latestCountMap()]);
  const prepItems = items.filter((item) => item.type === 'prep');

  let totalMinutes = 0;
  let missingTimeEstimate = false;
  let missingParLevel = false;

  const plan = prepItems
    .map((item) => {
      const onHand = counts[item.id]?.qty ?? null;
      const par = item.parLevel;

      if (par == null) missingParLevel = true;
      const gap = par != null && onHand != null ? Math.max(par - onHand, 0) : null;
      if (gap === null || gap <= 0) return null;

      const fraction = par > 0 ? gap / par : 1;
      const hasTime = typeof item.timeToMakeMinutesForPar === 'number';
      if (!hasTime) missingTimeEstimate = true;
      const minutesNeeded = hasTime ? Math.round(item.timeToMakeMinutesForPar * fraction) : null;
      if (minutesNeeded) totalMinutes += minutesNeeded;

      return {
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        onHand,
        par,
        gap: Math.round(gap * 100) / 100,
        minutesNeeded,
        storage: item.storage,
        needsReview: Boolean(item.needsReview) || !hasTime,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.minutesNeeded ?? 0) - (a.minutesNeeded ?? 0));

  const [h, m] = openTime.split(':').map(Number);
  const open = new Date();
  open.setHours(h, m, 0, 0);
  const suggestedStart = new Date(open.getTime() - (totalMinutes + bufferMinutes) * 60000);

  return {
    date: new Date().toISOString().split('T')[0],
    items: plan,
    totalMinutes,
    openTime,
    bufferMinutes,
    suggestedStartTime: suggestedStart.toTimeString().slice(0, 5),
    incomplete: missingTimeEstimate || missingParLevel,
    // True until real par levels + no-count items are entered, so the owner
    // knows the plan/time budget isn't trustworthy yet.
    uncountedItems: prepItems.filter((item) => counts[item.id]?.qty == null).map((item) => item.id),
  };
}

export async function getTodaysCleaning(date = new Date()) {
  const tasks = await cleaningStore.all();
  const dow = date.getDay(); // 0 = Sunday
  const dom = date.getDate();

  return tasks.filter((task) => {
    if (task.frequency === 'daily') return true;
    if (task.frequency === 'weekly') return task.dayOfWeek === dow;
    if (task.frequency === 'monthly') return task.dayOfMonth === dom;
    return false;
  });
}

export async function searchRecipes(query) {
  const recipes = await recipeStore.all();
  if (!query) return recipes;
  const q = query.toLowerCase();
  return recipes.filter((r) =>
    r.name.toLowerCase().includes(q) ||
    r.type?.toLowerCase().includes(q) ||
    r.searchTags?.some((tag) => tag.toLowerCase().includes(q))
  );
}
