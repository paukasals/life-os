import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class EmployeeManagementAgent extends BaseAgent {
  constructor() {
    super(
      'Employee Management',
      `You are the HR coordinator for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Team: Mix of food prep, service, and management staff across two concepts.
Track: Schedules, shift swaps, quality feedback, cross-training opportunities, retention.
Focus: Keep team motivated, ensure coverage, identify high-performers for leadership growth.`
    );
  }

  async run() {
    this.log('Running HR daily check...');
    const hrData = await this.fetchHRData();

    const prompt = `
HR snapshot for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(hrData, null, 2)}

Provide:
1. **Attendance**: Who's in, who's out today?
2. **Staffing**: Are we covered for service?
3. **Performance**: Any high-performers or concerns?
4. **One Action**: Top people-management priority today

Be supportive and operational.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`👥 *Team Update*\n${summary}`, 'telegram');
    return summary;
  }

  async fetchHRData() {
    // TODO: integrate with HR system (Gusto, BambooHR, Square, etc.)
    return {
      teamSize: 0,
      absentToday: [],
      upcomingShifts: [],
      pendingRequests: [],
      highPerformers: [],
      date: new Date().toISOString().split('T')[0],
    };
  }
}
