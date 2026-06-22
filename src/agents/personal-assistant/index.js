import { BaseAgent } from '../../shared/base-agent.js';

export class PersonalAssistantAgent extends BaseAgent {
  constructor() {
    super(
      'Personal Assistant',
      `You are a world-class executive personal assistant. You manage the user's schedule,
prioritize tasks, draft communications, set reminders, and ensure the user's day is
structured for maximum focus and minimal friction. You are proactive, organized, and brief.`
    );
  }

  async run() {
    this.log('Preparing daily briefing...');
    const agenda = await this.fetchAgenda();

    const response = await this.think(
      `Today's agenda and context: ${JSON.stringify(agenda, null, 2)}

Build a crisp morning briefing: top 3 priorities, meetings today with prep notes,
one thing to delegate, and one thing to protect time for.`
    );

    const briefing = response.content[0].text;
    this.log(briefing);
    await this.notify(`Good morning! Here is your briefing:\n\n${briefing}`, 'both');
    return briefing;
  }

  async fetchAgenda() {
    // TODO: integrate Google Calendar API
    return {
      meetings: [],
      tasks: [],
      deadlines: [],
      date: new Date().toISOString().split('T')[0],
    };
  }
}
