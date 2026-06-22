import { BaseAgent } from '../../shared/base-agent.js';
import { userProfile, config } from '../../shared/config.js';
import { googleCalendarService } from '../../shared/google-calendar.js';

export class DoctorAppointmentsAgent extends BaseAgent {
  constructor() {
    super(
      'Doctor & Appointments',
      `You are ${userProfile.name}'s meticulous health coordinator.

Track: annual checkups, sports medicine (water polo-related), training stress tests, supplement optimization, biometric monitoring.
Prepare: appointment questions, relevant biometric data, recovery & training logs, medication/supplement list.

Critical for someone training hard: quarterly check-ins with sports medicine, annual physical, HRV/readiness monitoring.`
    );
  }

  async run() {
    this.log('Checking medical calendar...');
    const appointments = await this.fetchAppointments();

    const upcoming = appointments.filter((a) => {
      const daysUntil = Math.ceil(
        (new Date(a.date) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return daysUntil >= 0 && daysUntil <= 14; // 2-week window
    });

    if (upcoming.length === 0) {
      this.log('No appointments in the next 2 weeks.');
      return null;
    }

    const prompt = `
Upcoming medical appointments for ${userProfile.name}:
${JSON.stringify(upcoming, null, 2)}

For each appointment:
1. Send reminder with date/time/location
2. List prep items (documents, questions, biometric data)
3. Suggest any pre-appointment actions (fasting, tracking, etc.)

Context: He trains hard (HIIT, Zone 2, water polo), takes supplements, and needs sports medicine perspective.`;

    const response = await this.think(prompt);
    const reminders = response.content[0].text;
    this.log(reminders);
    await this.notify(`📋 *Medical Reminders*\n\n${reminders}`, 'telegram');
    return reminders;
  }

  async fetchAppointments() {
    try {
      // Initialize Google Calendar if not already done
      if (!googleCalendarService.calendar) {
        const initialized = await googleCalendarService.initialize();
        if (!initialized) {
          this.error('Google Calendar not initialized');
          return [];
        }
      }

      // Fetch medical calendar events from Google Calendar
      const calendarId = config.calendar.calendarId || 'primary';
      const events = await googleCalendarService.getUpcomingEvents(calendarId, 14);

      // Filter for medical-related events
      const medicalEvents = events
        .filter((event) => {
          const title = event.summary?.toLowerCase() || '';
          const description = event.description?.toLowerCase() || '';
          const isMedical =
            title.includes('doctor') ||
            title.includes('appointment') ||
            title.includes('physical') ||
            title.includes('checkup') ||
            title.includes('medical') ||
            title.includes('sports medicine') ||
            description.includes('medical') ||
            description.includes('doctor');
          return isMedical;
        })
        .map((event) => ({
          id: event.id,
          title: event.summary,
          date: event.start?.dateTime || event.start?.date,
          location: event.location || 'Not specified',
          description: event.description || '',
          notes: event.description || '',
        }));

      return medicalEvents;
    } catch (err) {
      this.error('Failed to fetch appointments from Google Calendar', err);
      return [];
    }
  }
}

