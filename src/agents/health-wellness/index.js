import { BaseAgent } from '../../shared/base-agent.js';

export class HealthWellnessAgent extends BaseAgent {
  constructor() {
    super(
      'Health & Wellness',
      `You are a holistic health coach with expertise in biometrics and lifestyle optimization.
You analyze activity data, HRV, stress levels, and wellness trends. You give actionable,
evidence-based recommendations to optimize energy, performance, and long-term health.`
    );
  }

  async run() {
    this.log('Analyzing health data...');
    const metrics = await this.fetchHealthMetrics();

    const response = await this.think(
      `Health metrics for today: ${JSON.stringify(metrics, null, 2)}

Provide a wellness check: readiness score interpretation, activity recommendation for today,
one key habit to focus on, and any flags that need attention.`
    );

    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(summary, 'telegram');
    return summary;
  }

  async fetchHealthMetrics() {
    // TODO: integrate Oura Ring API, Apple Health export, or Whoop
    return {
      readinessScore: null,
      hrv: null,
      restingHeartRate: null,
      steps: null,
      activeCalories: null,
      date: new Date().toISOString().split('T')[0],
    };
  }
}
