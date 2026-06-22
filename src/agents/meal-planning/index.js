import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class MealPlanningAgent extends BaseAgent {
  constructor() {
    super(
      'Meal Planning',
      `You are ${userProfile.name}'s registered sports dietitian and meal planning expert. 

His protocol:
- 2 meals per day (intermittent fasting window)
- High-protein (supports HIIT + Zone 2 + water polo)
- Whey protein daily (post-training recovery)
- Whole foods focus: seafood (lobster rolls, oysters, ceviche), proteins, vegetables, healthy fats

Your role: design meal 1 and meal 2 with macros optimized for his training, provide prep tips, and support his businesses' ingredients.`
    );
  }

  async run() {
    this.log('Generating meal plan...');
    const context = await this.fetchContext();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const isSaturday = dayOfWeek === 'Saturday';

    const prompt = `
Meal plan for ${userProfile.name} on ${dayOfWeek}:
${JSON.stringify(context, null, 2)}

${isSaturday ? 'WATER POLO DAY: Prioritize carbs + protein for energy, post-game recovery meal with whey protein.' : 'Regular training day — balance macros for performance.'}

Suggest:
1. **Meal 1** (Main breakfast): Protein + carbs + fat, ~1000-1200 cal, macros
2. **Meal 2** (Dinner): Protein + vegetables, ~1000-1200 cal, macros
3. **Prep Tip**: One quick win for today (leverage Lobsteria ingredients?)
4. **Hydration**: Water + electrolyte reminder

Keep it actionable, not preachy.`;

    const response = await this.think(prompt);
    const plan = response.content[0].text;
    this.log(plan);
    await this.notify(`🍽️ *Today's Meal Plan*\n\n${plan}`, 'telegram');
    return plan;
  }

  async fetchContext() {
    return {
      mealsPerDay: 2,
      dietType: 'High Protein',
      dailyProteinTarget: '200g+', // typical for his training
      supplements: 'Whey Protein post-meal 1 or post-training',
      availableIngredients: [
        'Lobster',
        'Oysters',
        'Fresh fish',
        'Lean meat',
        'Eggs',
        'Greek yogurt',
        'Vegetables',
      ],
      trainingSchedule: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      date: new Date().toISOString().split('T')[0],
    };
  }
}

