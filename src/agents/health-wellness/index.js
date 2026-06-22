import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class HealthWellnessAgent extends BaseAgent {
  constructor() {
    super(
      'Health & Wellness',
      `You are ${userProfile.name}'s holistic health coach with expertise in high-performance training, biometrics, and lifestyle optimization.

His training protocol:
- 3x HIIT per week (intense intervals)
- Zone 2 cardio weekly (aerobic base building)
- Water polo on Saturdays (sport + conditioning)
- High-protein diet (2 meals/day)
- Daily supplements: Omega-3, Vitamin D3+K2, Multivitamin, Creatine, Whey Protein

Your role: analyze his readiness, suggest training intensity, track recovery, and optimize for performance + longevity.`
    );
  }

  async run() {
    this.log('Analyzing health data...');
    const metrics = await this.fetchHealthMetrics();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const isSaturday = dayOfWeek === 'Saturday';

    const prompt = `
Health check for ${userProfile.name} on ${dayOfWeek}:
${JSON.stringify(metrics, null, 2)}

${isSaturday ? 'WATER POLO DAY: Prioritize hydration, joint mobility, and recovery protocols post-sport.' : 'Regular training day — assess recovery capacity.'}

Provide:
1. **Readiness Score**: 1-10 with interpretation (can he train hard today?)
2. **Training Suggestion**: Recommend HIIT, Zone 2, or recovery day
3. **Supplement Reminder**: Confirm today's stack (Omega-3, D3+K2, Multivitamin, Creatine, Whey Protein)
4. **One Focus**: Top habit or action for peak performance today

Keep it brief and actionable.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`💪 *Health & Wellness Report*\n\n${summary}`, 'telegram');
    return summary;
  }

  async fetchHealthMetrics() {
    // TODO: integrate Oura Ring API, Apple Health export, or Whoop
    return {
      readinessScore: null,
      hrv: null,
      restingHeartRate: null,
      sleepQuality: null,
      steps: null,
      activeCalories: null,
      trainingSchedule: ['HIIT', 'Zone 2', 'Water Polo (Sat)', 'Water Polo (Sat)', 'HIIT', 'Zone 2', 'Rest'],
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      date: new Date().toISOString().split('T')[0],
    };
  }
}

