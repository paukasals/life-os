#!/usr/bin/env node

import { googleCalendarService } from './src/shared/google-calendar.js';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function getUserInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function setupGoogleCalendar() {
  console.log('\n🔐 Google Calendar Setup\n');
  console.log('This script will help you authenticate Life OS with Google Calendar.\n');

  // Check if credentials file exists
  const credentialsPath = process.env.GOOGLE_CALENDAR_CREDENTIALS_PATH || path.join(__dirname, 'credentials.json');
  
  try {
    await fs.access(credentialsPath);
  } catch {
    console.error('❌ credentials.json not found at:', credentialsPath);
    console.log('\n📋 To set up Google Calendar integration:\n');
    console.log('1. Go to Google Cloud Console: https://console.cloud.google.com');
    console.log('2. Create a new project or select existing one');
    console.log('3. Enable Google Calendar API');
    console.log('4. Create OAuth 2.0 credentials (Desktop Application)');
    console.log('5. Download credentials as JSON and save as credentials.json in project root');
    console.log('6. Set GOOGLE_CALENDAR_CREDENTIALS_PATH in .env if file is in different location\n');
    process.exit(1);
  }

  try {
    const authUrl = await googleCalendarService.getAuthUrl();
    if (!authUrl) {
      throw new Error('Failed to generate auth URL');
    }

    console.log('📖 Opening Google authentication URL...\n');
    console.log('🔗 If browser doesn\'t open, visit this URL:\n');
    console.log(authUrl);
    console.log('\n');

    const code = await getUserInput('📝 Paste the authorization code from Google: ');

    if (!code || code.trim() === '') {
      console.error('❌ No code provided');
      process.exit(1);
    }

    console.log('\n⏳ Exchanging code for tokens...');
    const success = await googleCalendarService.saveToken(code.trim());

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
  }
}

setupGoogleCalendar();
