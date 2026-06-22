import cron from 'node-cron';
import { notifier } from '../notifications/index.js';

import { MarketingAgent } from '../agents/marketing/index.js';
import { FinanceAgent } from '../agents/finance/index.js';
import { InventoryAgent } from '../agents/inventory/index.js';
import { RevenueDashboardAgent } from '../agents/revenue-dashboard/index.js';
import { CustomerReviewMonitorAgent } from '../agents/customer-review-monitor/index.js';
import { ContentCalendarAgent } from '../agents/content-calendar/index.js';
import { EmployeeManagementAgent } from '../agents/employee-management/index.js';
import { PersonalAssistantAgent } from '../agents/personal-assistant/index.js';
import { HealthWellnessAgent } from '../agents/health-wellness/index.js';
import { MealPlanningAgent } from '../agents/meal-planning/index.js';
import { SleepRecoveryAgent } from '../agents/sleep-recovery/index.js';
import { DoctorAppointmentsAgent } from '../agents/doctor-appointments/index.js';

class MasterOrchestrator {
  constructor() {
    this.agents = {
      marketing: new MarketingAgent(),
      finance: new FinanceAgent(),
      inventory: new InventoryAgent(),
      revenueDashboard: new RevenueDashboardAgent(),
      reviewMonitor: new CustomerReviewMonitorAgent(),
      contentCalendar: new ContentCalendarAgent(),
      employeeManagement: new EmployeeManagementAgent(),
      personalAssistant: new PersonalAssistantAgent(),
      healthWellness: new HealthWellnessAgent(),
      mealPlanning: new MealPlanningAgent(),
      sleepRecovery: new SleepRecoveryAgent(),
      doctorAppointments: new DoctorAppointmentsAgent(),
    };
  }

  async runAgent(name) {
    const agent = this.agents[name];
    if (!agent) throw new Error(`Unknown agent: ${name}`);
    console.log(`[Orchestrator] Running agent: ${name}`);
    return agent.run().catch((err) => {
      console.error(`[Orchestrator] Agent "${name}" failed:`, err.message);
    });
  }

  async runAll() {
    console.log('[Orchestrator] Running all agents...');
    await Promise.allSettled(Object.keys(this.agents).map((name) => this.runAgent(name)));
    console.log('[Orchestrator] All agents completed.');
  }

  scheduleCrons() {
    const tz = process.env.TIMEZONE || 'UTC';

    // Morning briefing — 7:00 AM
    cron.schedule('0 7 * * *', () => {
      this.runAgent('personalAssistant');
      this.runAgent('sleepRecovery');
      this.runAgent('healthWellness');
      this.runAgent('mealPlanning');
    }, { timezone: tz });

    // Business morning — 8:30 AM
    cron.schedule('30 8 * * 1-5', () => {
      this.runAgent('revenueDashboard');
      this.runAgent('finance');
      this.runAgent('marketing');
      this.runAgent('inventory');
      this.runAgent('employeeManagement');
    }, { timezone: tz });

    // Content calendar check — 9:00 AM
    cron.schedule('0 9 * * 1-5', () => {
      this.runAgent('contentCalendar');
    }, { timezone: tz });

    // Review monitor — every 4 hours
    cron.schedule('0 */4 * * *', () => {
      this.runAgent('reviewMonitor');
    }, { timezone: tz });

    // Doctor appointments — 8:00 AM daily
    cron.schedule('0 8 * * *', () => {
      this.runAgent('doctorAppointments');
    }, { timezone: tz });

    console.log('[Orchestrator] Cron schedules registered.');
  }

  start() {
    notifier.init();
    this.scheduleCrons();
    console.log('[Life OS] Master orchestrator running. All crons active.');
    notifier.send('[Life OS] System started successfully.', 'telegram');
  }
}

export const orchestrator = new MasterOrchestrator();
