import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_PATH = path.join(__dirname, '../../.google-calendar-token.json');
const CREDENTIALS_PATH = process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH || path.join(__dirname, '../../credentials.json');
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback';

class GoogleCalendarService {
  constructor() {
    this.auth = null;
    this.calendar = null;
  }

  async initialize() {
    try {
      const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf-8'));
      const { client_secret, client_id } = credentials.installed;
      
      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        REDIRECT_URI
      );

      // Try to load existing token
      try {
        const token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf-8'));
        this.oauth2Client.setCredentials(token);
      } catch (err) {
        // No token yet - user needs to authenticate
        throw new Error('Google Calendar token not found. Run setup first.');
      }

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      return true;
    } catch (err) {
      console.error('Google Calendar initialization failed:', err.message);
      return false;
    }
  }

  async getAuthUrl() {
    try {
      const credentials = JSON.parse(await fs.readFile(CREDENTIALS_PATH, 'utf-8'));
      const { client_secret, client_id } = credentials.installed;
      
      this.oauth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        REDIRECT_URI
      );

      const scopes = [
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar',
      ];

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', client_id);
      authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('scope', scopes.join(' '));
      authUrl.searchParams.set('prompt', 'consent');

      return authUrl.toString();
    } catch (err) {
      console.error('Failed to generate auth URL:', err.message);
      return null;
    }
  }

  async saveToken(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2));
      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      return true;
    } catch (err) {
      console.error('Failed to save token:', err.message);
      return false;
    }
  }

  async getEvents(calendarId = 'primary', timeMin = null, timeMax = null) {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      // Default to next 30 days if not specified
      const now = new Date();
      const startTime = timeMin || now.toISOString();
      const endTime = timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await this.calendar.events.list({
        calendarId,
        timeMin: startTime,
        timeMax: endTime,
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (err) {
      console.error('Failed to fetch calendar events:', err.message);
      return [];
    }
  }

  async getEventsByDate(calendarId, targetDate) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return await this.getEvents(calendarId, startOfDay.toISOString(), endOfDay.toISOString());
  }

  async getUpcomingEvents(calendarId, daysAhead = 14) {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    return await this.getEvents(calendarId, now.toISOString(), future.toISOString());
  }

  async createEvent(calendarId, event) {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      const response = await this.calendar.events.insert({
        calendarId,
        requestBody: event,
      });
      return response.data;
    } catch (err) {
      console.error('Failed to create event:', err.message);
      return null;
    }
  }

  async updateEvent(calendarId, eventId, event) {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      const response = await this.calendar.events.update({
        calendarId,
        eventId,
        requestBody: event,
      });
      return response.data;
    } catch (err) {
      console.error('Failed to update event:', err.message);
      return null;
    }
  }

  async deleteEvent(calendarId, eventId) {
    if (!this.calendar) {
      throw new Error('Google Calendar not initialized');
    }

    try {
      await this.calendar.events.delete({
        calendarId,
        eventId,
      });
      return true;
    } catch (err) {
      console.error('Failed to delete event:', err.message);
      return false;
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
