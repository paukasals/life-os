# Railway Deployment Guide

This guide covers setting up Life OS on Railway with Google Calendar integration, secure credential handling, and CI/CD automation.

## Quick Setup

### 1. Create Railway Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your Railway project (or create a new one)
railway link
```

### 2. Set Environment Variables

In Railway Dashboard → Variables, add:

```env
# Anthropic
ANTHROPIC_API_KEY=<your-anthropic-api-key>

# Telegram
TELEGRAM_BOT_TOKEN=<your-telegram-bot-token>
TELEGRAM_CHAT_ID=<your-telegram-chat-id>

# Business
BUSINESS_NAME=Lobsteria & The Crepes & Waffles Bar
TIMEZONE=America/New_York

# Google Calendar
GOOGLE_CALENDAR_CREDENTIALS_PATH=./credentials.json
GOOGLE_CALENDAR_ID=primary
GOOGLE_CLIENT_ID=<your-client-id-from-google-cloud>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-google-cloud>
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Health
APPLE_HEALTH_API_KEY=your_api_key

# Marketing
GOOGLE_ADS_API_KEY=your_api_key
META_ACCESS_TOKEN=your_token

# Finance
STRIPE_SECRET_KEY=your_key
BANK_API_KEY=your_key
```

### 3. Handle credentials.json Securely

**Option A: Using Railway File Mounts (Recommended)**

Railway doesn't support file mounts directly, so we'll use environment variable injection instead.

**Option B: Base64 Encode Method**

1. Encode your credentials.json:
   ```bash
   cat credentials.json | base64
   ```

2. Add to Railway as environment variable:
   ```env
   GOOGLE_CREDENTIALS_BASE64=<paste_base64_here>
   ```

3. Railway will automatically decode it on startup via the init script.

**Option C: GitHub Secrets + Actions (See GitHub Actions section below)**

This is the most secure method for CI/CD.

## Deployment Methods

### Method 1: Manual Deployment

```bash
# Deploy current branch
railway deploy

# Check deployment status
railway status

# View logs
railway logs
```

### Method 2: Automatic Deployment via GitHub Actions

See **GitHub Actions Setup** section below for continuous deployment on every push.

### Method 3: Deploy from Railway Dashboard

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your **life-os** project
3. Click **Deploy** button
4. It will automatically pull the latest from GitHub

## Handling credentials.json for Production

### Setup: Initialize credentials.json on Startup

Create `init-credentials.js` in the project root:

```javascript
import { promises as fs } from 'fs';
import path from 'path';

export async function initializeCredentials() {
  const credentialsPath = './credentials.json';

  // Check if credentials.json already exists
  try {
    await fs.access(credentialsPath);
    console.log('✅ credentials.json already exists');
    return true;
  } catch {
    // File doesn't exist, try to create it from environment variable
  }

  // Try Option B: Base64-encoded credentials
  if (process.env.GOOGLE_CREDENTIALS_BASE64) {
    try {
      const credentialsJson = Buffer.from(
        process.env.GOOGLE_CREDENTIALS_BASE64,
        'base64'
      ).toString('utf-8');
      await fs.writeFile(credentialsPath, credentialsJson);
      console.log('✅ credentials.json created from GOOGLE_CREDENTIALS_BASE64');
      return true;
    } catch (err) {
      console.error('❌ Failed to create credentials.json from base64:', err.message);
      return false;
    }
  }

  // Try Option C: Individual environment variables (fallback)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
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
      return true;
    } catch (err) {
      console.error('❌ Failed to create credentials.json:', err.message);
      return false;
    }
  }

  console.error(
    '❌ No credentials found. Please set GOOGLE_CREDENTIALS_BASE64 or individual GOOGLE_* variables.'
  );
  return false;
}
```

Update your main `index.js`:

```javascript
import { initializeCredentials } from './init-credentials.js';

// Initialize credentials before starting agents
const credentialsReady = await initializeCredentials();
if (!credentialsReady) {
  console.error('Failed to initialize Google Calendar credentials');
  process.exit(1);
}

// Continue with your existing code
const orchestrator = new Orchestrator();
await orchestrator.start();
```

## GitHub Actions: Automatic Deployment

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Deploy to Railway
        run: |
          npm install -g @railway/cli
          railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

      - name: Update Railway Environment Variables
        run: |
          railway variables set \
            ANTHROPIC_API_KEY="${{ secrets.ANTHROPIC_API_KEY }}" \
            TELEGRAM_BOT_TOKEN="${{ secrets.TELEGRAM_BOT_TOKEN }}" \
            TELEGRAM_CHAT_ID="${{ secrets.TELEGRAM_CHAT_ID }}" \
            GOOGLE_CREDENTIALS_BASE64="${{ secrets.GOOGLE_CREDENTIALS_BASE64 }}" \
            GOOGLE_CLIENT_ID="${{ secrets.GOOGLE_CLIENT_ID }}" \
            GOOGLE_CLIENT_SECRET="${{ secrets.GOOGLE_CLIENT_SECRET }}"
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

### GitHub Secrets Setup

1. Go to GitHub repo → **Settings → Secrets and variables → Actions**
2. Add these secrets:

```
RAILWAY_TOKEN           (get from railway login token)
ANTHROPIC_API_KEY       (your API key)
TELEGRAM_BOT_TOKEN      (your bot token)
TELEGRAM_CHAT_ID        (your chat ID)
GOOGLE_CREDENTIALS_BASE64 (base64-encoded credentials.json)
GOOGLE_CLIENT_ID        (from your credentials)
GOOGLE_CLIENT_SECRET    (from your credentials)
```

**To get base64 of credentials.json:**

```bash
cat credentials.json | base64 | pbcopy  # macOS
# or
cat credentials.json | base64 > /tmp/creds.txt  # Linux
```

Then paste into GitHub Secrets.

## Testing Deployment

### Local Testing (Simulate Railway Environment)

```bash
# Set up credentials for testing
GOOGLE_CREDENTIALS_BASE64=$(cat credentials.json | base64) node index.js

# Or with individual variables
GOOGLE_CLIENT_ID=your_id GOOGLE_CLIENT_SECRET=your_secret node index.js
```

### Railway Testing

```bash
# SSH into Railway environment
railway shell

# Check if credentials initialized correctly
cat credentials.json

# Check logs
railway logs -n 50

# Restart service
railway restart
```

## Troubleshooting

### "credentials.json not found"

1. Check if `GOOGLE_CREDENTIALS_BASE64` is set in Railway Variables
2. Or verify individual `GOOGLE_CLIENT_*` variables are present
3. Restart the service: `railway restart`

### "Invalid OAuth credentials"

1. Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct
2. Check that `GOOGLE_REDIRECT_URI` matches your Railway domain
3. For localhost testing, use `http://localhost:3000/auth/callback`

### "Token expired"

The token is stored in `.google-calendar-token.json` which persists in Railway's filesystem. If it expires:

1. Delete the token file via Railway shell:
   ```bash
   railway shell
   rm .google-calendar-token.json
   exit
   ```

2. Restart and re-authenticate:
   ```bash
   railway logs -f  # Watch logs
   # Wait for re-auth prompt (check Telegram)
   ```

### GitHub Actions Failing

1. Verify all secrets are set in GitHub Settings
2. Check `RAILWAY_TOKEN` is valid:
   ```bash
   railway login --token-only
   ```
3. View GitHub Actions logs in repo → **Actions** tab

## Monitoring & Logs

### View Logs in Railway Dashboard

1. Go to Railway project → **life-os** service
2. Click **Logs** tab
3. Filter by time/level as needed

### Stream Logs Locally

```bash
railway logs -f  # Follow logs in real-time
railway logs -n 100  # Last 100 lines
railway logs --since 1h  # Last hour
```

### Set Up Alerts

In Railway Dashboard:
1. Go to Project → **Notifications**
2. Add Telegram notification for deployment failures
3. Configure alerts for CPU/memory usage

## Cost Optimization

Railway's free tier includes:
- 5GB of persistent disk
- $5 monthly credit
- Unlimited outbound bandwidth

For a low-traffic Life OS:
- CPU: ~100-500m (plenty of headroom on free tier)
- Memory: ~100-200MB (minimal)
- Storage: < 1GB (credentials + logs)

**Estimated monthly cost: Free or $2-5**

---

## Complete Deployment Checklist

- [ ] GitHub repo updated and pushed
- [ ] Railway project created and linked
- [ ] Environment variables added to Railway
- [ ] GitHub Secrets configured (if using CI/CD)
- [ ] `init-credentials.js` added to project
- [ ] `index.js` updated to call `initializeCredentials()`
- [ ] GitHub Actions workflow created (optional)
- [ ] Local test: `GOOGLE_CREDENTIALS_BASE64=... npm start`
- [ ] Railway deployment: `railway deploy` or push to GitHub
- [ ] Verify doctor-appointments agent runs at 8:30 AM
- [ ] Check Telegram for calendar reminders

---

Next: Follow the Quick Setup steps above, starting with creating a Railway project!
