import { BaseAgent } from '../../shared/base-agent.js';

export class DoctorAppointmentsAgent extends BaseAgent {
  constructor() {
    super(
      'Doctor & Appointments',
      `You are a meticulous health coordinator. You track medical appointments, follow-up reminders,
medication schedules, test results, and preventive care due dates. You send timely reminders
and help the user prepare for appointments with the right questions and documents.`
    );
  }

  async run() {
    this.log('Checking medical calendar...');
    const appointments = await this.fetchAppointments();

    const upcoming = appointments.filter((a) => {
      const daysUntil = Math.ceil(
        (new Date(a.date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= 0 && daysUntil <= 7;
    });

    if (upcoming.length === 0) {
      this.log('No upcoming appointments in the next 7 days.');
      return null;
    }

    const response = await this.think(
      `Upcoming appointments: ${JSON.stringify(upcoming, null, 2)}

For each appointment: send a reminder with the date/time, what to prepare (documents, questions),
and any pre-appointment instructions. Flag anything overdue.`
    );

    const reminders = response.content[0].text;
    this.log(reminders);
    await this.notify(`Medical Reminders:\n\n${reminders}`, 'both');
    return reminders;
  }

  async fetchAppointments() {
    // TODO: integrate with Google Calendar or a local appointments store
    return [
      // { id: '1', type: 'General checkup', doctor: 'Dr. Smith', date: '2026-06-25T10:00:00', location: 'Clinic A' }
    ];
  }
}
