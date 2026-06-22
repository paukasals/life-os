import { BaseAgent } from '../../shared/base-agent.js';

export class MealPlanningAgent extends BaseAgent {
  constructor() {
    super(
      'Meal Planning',
      `You are a registered dietitian and meal planning expert. You create practical meal plans
aligned with the user's health goals, dietary preferences, and schedule. You factor in
nutritional balance, prep time, and what ingredients are available.`
    );
  }

  async run() {
    this.log('Generating meal plan...');
    const context = await this.fetchContext();

    const response = await this.think(
      `User context: ${JSON.stringify(context, null, 2)}

Suggest today's meal plan (breakfast, lunch, dinner, snacks) with approximate macros.
Keep it realistic and aligned with the health goals. Include one quick meal prep tip.`
    );

    const plan = response.content[0].text;
    this.log(plan);
    await this.notify(`Today's Meal Plan:\n\n${plan}`, 'telegram');
    return plan;
  }

  async fetchContext() {
    // TODO: read user preferences from a config/profile file or database
    return {
      dietaryPreferences: [],
      calorieTarget: null,
      proteinTarget: null,
      availableIngredients: [],
      healthGoal: 'maintain energy and focus',
      date: new Date().toISOString().split('T')[0],
    };
  }
}
