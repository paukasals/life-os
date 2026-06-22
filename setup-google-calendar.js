#!/usr/bin/env node

import { googleCalendarService } from './src/shared/google-calendar.js';
import { promises as fs } from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;
const CALLBACK_PATH = '/auth/callback';
const REDIRECT_URI = `http://localhost:${PORT}${CALLBACK_PATH}`;
const BASE_URL = `http://localhost:${PORT}`;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar',
];

async function openBrowser(url) {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
    ? 'start'
    : 'xdg-open';

  return new Promise((resolve) => {
    exec(`${command} "${url}"`, () => resolve());
  });
}

async function setupGoogleCalendar() {
  console.log('\n🔐 Google Calendar Setup\n');
  console.log('This script will help you authenticate Life OS with Google Calendar.\n');

  const credentialsPath = process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH || path.join(__dirname, 'credentials.json');
  try {
    await fs.access(credentialsPath);
  } catch {
    console.error('❌ credentials.json not found at:', credentialsPath);
    console.log('\n📋 To set up Google Calendar integration:\n');
    console.log('1. Go to Google Cloud Console: https://console.cloud.google.com');
    console.log('2. Create a new project or select existing one');
    console.log('3. Enable Google Calendar API');
    console.log('4. Create OAuth 2.0 credentials with redirect URI: http://localhost:3000/auth/callback');
    console.log('5. Download credentials as JSON and save as credentials.json in project root');
    console.log('6. Set GOOGLE_CALENDAR_CREDENTIALS_PATH in .env if file is in different location\n');
    process.exit(1);
  }

  try {
    const authUrl = await googleCalendarService.getAuthUrl();
    if (!authUrl) {
      throw new Error('Failed to generate auth URL');
    }

    const authUrlWithRedirect = new URL(authUrl);
    authUrlWithRedirect.searchParams.set('redirect_uri', REDIRECT_URI);

    const server = http.createServer(async (req, res) => {
      if (!req.url || !req.url.startsWith(CALLBACK_PATH)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const url = new URL(req.url, BASE_URL);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authentication failed</h1><p>${error}</p>`);
        console.error('❌ OAuth error:', error);
        server.close();
        process.exit(1);
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Missing code</h1><p>No authorization code was returned.</p>');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Authentication successful</h1><p>You can close this window and return to the terminal.</p>');

      try {
        console.log('\n⏳ Exchanging code for tokens...');
        const success = await googleCalendarService.saveToken(code);
        if (success) {
          console.log('✅ Google Calendar authentication successful!\n');
          console.log('📝 Token saved. You can now use Google Calendar with Life OS.\n');
          console.log('📌 Make sure to set in .env:\n');
          console.log('   GOOGLE_CALENDAR_ID=primary  (or your specific calendar ID)\n');
        } else {
          console.error('❌ Failed to save token');
          process.exit(1);
        }
      } catch (err) {
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
      } finally {
        server.close();
      }
    });

    server.listen(PORT, async () => {
      console.log(`🌐 Waiting for Google callback at ${REDIRECT_URI}`);
      console.log('📖 Opening Google authentication URL...\n');
      console.log('🔗 If browser does not open automatically, visit this URL:');
      console.log(authUrlWithRedirect.toString());
      console.log('\n');
      await openBrowser(authUrlWithRedirect.toString());
    });

    server.on('error', (err) => {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

setupGoogleCalendar();
