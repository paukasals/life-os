import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function initializeCredentials() {
  const credentialsPath = path.join(__dirname, 'credentials.json');
  const tokenPath = path.join(__dirname, '.google-calendar-token.json');

  // Check if credentials.json already exists
  try {
    await fs.access(credentialsPath);
    console.log('✅ credentials.json already exists');
  } catch {
    // File doesn't exist, try to create it from environment variable
    // Try Option A: Base64-encoded credentials (from Railway/CI-CD)
    if (process.env.GOOGLE_CREDENTIALS_BASE64) {
      try {
        const credentialsJson = Buffer.from(
          process.env.GOOGLE_CREDENTIALS_BASE64,
          'base64'
        ).toString('utf-8');
        await fs.writeFile(credentialsPath, credentialsJson);
        console.log('✅ credentials.json created from GOOGLE_CREDENTIALS_BASE64');
      } catch (err) {
        console.error('❌ Failed to create credentials.json from base64:', err.message);
        return false;
      }
    } else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      // Try Option B: Individual environment variables (fallback)
      try {
        const credentials = {
          installed: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uris: [process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/callback'],
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token',
          },
        };
        await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2));
        console.log('✅ credentials.json created from environment variables');
      } catch (err) {
        console.error('❌ Failed to create credentials.json:', err.message);
        return false;
      }
    } else if (process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT_NAME) {
      // If we're in production (Railway), require credentials
      console.error(
        '❌ No Google credentials found. Please set GOOGLE_CREDENTIALS_BASE64 or individual GOOGLE_CLIENT_* environment variables in Railway.'
      );
      return false;
    } else {
      // In development, warn but don't fail
      console.warn(
        '⚠️  No credentials.json found and no GOOGLE_CREDENTIALS_BASE64 set. Google Calendar features will not work.'
      );
      console.warn('   To set up credentials, run: node setup-google-calendar.js');
      return false;
    }
  }

  // Initialize OAuth token from base64 if provided (Railway env)
  if (process.env.GOOGLE_CALENDAR_TOKEN_BASE64) {
    try {
      const tokenJson = Buffer.from(
        process.env.GOOGLE_CALENDAR_TOKEN_BASE64,
        'base64'
      ).toString('utf-8');
      await fs.writeFile(tokenPath, tokenJson);
      console.log('✅ .google-calendar-token.json created from GOOGLE_CALENDAR_TOKEN_BASE64');
    } catch (err) {
      console.error('❌ Failed to create token from base64:', err.message);
      // Non-fatal; let user authenticate manually or in local setup
    }
  }

  return true;
}
