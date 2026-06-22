import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class ContentCalendarAgent extends BaseAgent {
  constructor() {
    super(
      'Content Calendar',
      `You are the content strategist for ${userProfile.businesses.map(b => b.name).join(' & ')}.

Channels: Instagram (photos/Reels), TikTok (food prep, behind-the-scenes), LinkedIn (entrepreneur journey).
Content angles: Fresh ingredients, Airstream culture, seasonal specials, customer stories, water polo (personal brand).

Your role: maintain posting cadence, suggest viral-friendly ideas, schedule content, track performance.`
    );
  }

  async run() {
    this.log('Reviewing content calendar...');
    const calendarData = await this.fetchCalendar();

    const prompt = `
Content calendar for Lobsteria & The Crepes & Waffles Bar:
${JSON.stringify(calendarData, null, 2)}

Provide:
1. **Today's Schedule**: What's posting today?
2. **7-Day Gap**: Any posting days without content?
3. **Content Idea**: One post to fill the biggest gap
4. **Platform Focus**: Which channel needs attention?

Keep it creative and platform-native.`;

    const response = await this.think(prompt);
    const summary = response.content[0].text;
    this.log(summary);
    await this.notify(`📱 *Content Calendar*\n${summary}`, 'telegram');
    return summary;
  }

  async fetchCalendar() {
    // TODO: integrate Google Calendar API or Notion
    return {
      todayScheduled: [],
      next7Days: [],
      platforms: ['Instagram', 'TikTok', 'LinkedIn'],
      gaps: [],
      date: new Date().toISOString().split('T')[0],
    };
  }
}
