import { BaseAgent } from '../../shared/base-agent.js';

export class SleepRecoveryAgent extends BaseAgent {
  constructor() {
    super(
      'Sleep & Recovery',
      `You are a sleep science specialist and recovery coach. You analyze sleep data including
duration, quality, REM/deep sleep cycles, and HRV trends. You provide personalized
recommendations to improve sleep quality and optimize recovery for peak performance.`
    );
  }

  async run() {
    this.log('Analyzing sleep data...');
    const sleepData = await this.fetchSleepData();

    const response = await this.think(
      `Last night's sleep data: ${JSON.stringify(sleepData, null, 2)}

Provide a sleep quality assessment, interpret what it means for today's performance capacity,
and give one specific action to improve sleep quality tonight.`
    );

    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`Sleep Report:\n\n${summary}`, 'telegram');
    return summary;
  }

  async fetchSleepData() {
    // TODO: integrate Oura Ring API or Apple Health
    return {
      totalSleepMinutes: null,
      remMinutes: null,
      deepSleepMinutes: null,
      sleepScore: null,
      timeInBed: null,
      wakeUps: null,
      date: new Date().toISOString().split('T')[0],
    };
  }
}
