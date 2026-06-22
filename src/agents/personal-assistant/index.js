import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile } from '../../shared/config.js';

export class PersonalAssistantAgent extends BaseAgent {
  constructor() {
    super(
      'Personal Assistant',
      `You are ${userProfile.name}'s world-class executive personal assistant. You manage his schedule,
prioritize tasks, draft communications, set reminders, and ensure his day is structured for maximum 
focus and minimal friction. You are proactive, organized, evidence-based, and brief.

Known context:
- Name: ${userProfile.name} (Barcelona-born, based in Miami)
- Businesses: Lobsteria (food truck) & The Crepes & Waffles Bar
- Health: 2 meals/day, high protein diet, training 3x HIIT + Zone 2 cardio weekly
- Weekly commitment: Water polo on Saturdays
- Supplements: Omega-3, Vitamin D3+K2, Multivitamin, Creatine, Whey Protein

Your role: synthesize briefings from health, meals, sleep, and business agents into ONE crisp, actionable morning briefing.`
    );
  }

  async run() {
    this.log('Preparing comprehensive morning briefing...');
    
    const briefing = await this.generateMorningBriefing();
    this.log(briefing);
    
    // Send to Telegram with morning emoji
    await this.notify(`🌅 *MORNING BRIEFING — ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}*\n\n${briefing}`, 'telegram');
    
    return briefing;
  }

  async generateMorningBriefing() {
    const agenda = await this.fetchAgenda();
    const dayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    
    // Special context for Saturday (water polo day)
    const isSaturday = dayOfWeek === 'Saturday';
    const saturdayContext = isSaturday 
      ? '\n\nSPECIAL NOTE: Today is Saturday — water polo day. Prioritize hydration, pre-game nutrition, and recovery.'
      : '';

    const briefingPrompt = `
You are preparing ${userProfile.name}'s morning briefing. Today is ${dayOfWeek}.

Daily context:
${JSON.stringify(agenda, null, 2)}

${saturdayContext}

Generate a crisp, 3-part morning briefing:

**PRIORITY MATRIX** (Top 3 for today)
1. [Highest-impact business action]
2. [Health/personal priority]
3. [Secondary business or personal win]

**DAILY SCHEDULE** (key moments)
- Morning: [Prep & first meal timing]
- Mid-day: [Business execution window]
- Evening: [Recovery/meal 2/wind-down]

**ONE THING TO PROTECT**
[Single focus block or non-negotiable this Pau needs to guard]

Format: Brief, conversational, actionable, no fluff.`;

    const response = await this.think(briefingPrompt);
    return response.content[0].text;
  }

  async fetchAgenda() {
    // TODO: integrate Google Calendar API for real meetings
    // For now, return static context
    return {
      meetings: [],
      businessTasks: ['Check Lobsteria sales', 'Review The Crepes & Waffles performance'],
      personalTasks: ['2 high-protein meals', 'Supplements: Omega-3, D3+K2, Multivitamin, Creatine, Whey Protein', 'Hydration check'],
      trainingSessions: [],
      deadlines: [],
      date: new Date().toISOString().split('T')[0],
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    };
  }
}

