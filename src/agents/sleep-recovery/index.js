import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class SleepRecoveryAgent extends BaseAgent {
  constructor() {
    super(
      'Sleep & Recovery',
      `You are ${userProfile.name}'s sleep science specialist and recovery coach.

His training load: 3x HIIT + Zone 2 cardio + Water polo = HIGH recovery demand
Your job: monitor sleep quality, HRV trends, and recovery status. Flag when he needs extra rest.
Alert if sleep is compromised (impacts training performance).

Optimize for: 7-9 hour consolidated sleep, high REM/deep ratio, morning readiness.`
    );
  }

  async run() {
    this.log('Analyzing sleep data...');
    const sleepData = await this.fetchSleepData();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const isSaturday = dayOfWeek === 'Saturday';

    const prompt = `
Sleep & Recovery report for ${userProfile.name} on ${dayOfWeek}:
${JSON.stringify(sleepData, null, 2)}

${isSaturday ? 'POST-WATER-POLO: Recovery is critical — assess if extra sleep or active recovery is needed today.' : 'Regular day — track baseline recovery metrics.'}

Provide:
1. **Sleep Quality Score**: 1-10 with interpretation
2. **Recovery Status**: How ready is his body for training?
3. **Recovery Action**: One thing to do tonight (sleep hygiene, supplement, wind-down)
4. **HRV/RHR Trend**: Any flags from baseline?

Be concise and actionable.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`😴 *Sleep & Recovery Report*\n\n${summary}`, 'telegram');
    return summary;
  }

  async fetchSleepData() {
    // TODO: integrate Oura Ring API, Apple Health, or Whoop
    return {
      lastNightSleepMinutes: null,
      remMinutes: null,
      deepSleepMinutes: null,
      sleepScore: null,
      timeInBed: null,
      wakeUps: null,
      hrv: null,
      restingHeartRate: null,
      recoveryIndex: null,
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      date: new Date().toISOString().split('T')[0],
    };
  }
}

