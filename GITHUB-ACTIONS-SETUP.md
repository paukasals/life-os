# GitHub Actions + Railway Setup Guide

This guide will help you set up automatic deployments from GitHub to Railway with secure secret management.

## Overview

When you push to `main` branch:
1. GitHub Actions automatically runs tests (optional)
2. Deploys to Railway
3. Sends Telegram notification of deployment status

## Step 1: Create GitHub Secrets

Go to your GitHub repo:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

### Required Secrets

```
RAILWAY_TOKEN
Purpose: Authentication with Railway
How to get: 
  1. Go to railway.app
  2. Click your profile → API Tokens
  3. Create new token
  4. Copy and paste here
```

### Optional: Telegram Notifications

```
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
Purpose: Deploy status notifications
How to get:
  1. You already have these in .env
  2. Get from your Telegram bot setup
```

### Optional: Google Calendar Credentials

```
GOOGLE_CREDENTIALS_BASE64
Purpose: If you want Railway to auto-initialize Google Calendar
How to get:
  1. Locally: cat credentials.json | base64
  2. macOS: cat credentials.json | base64 | pbcopy
  3. Linux: cat credentials.json | base64 > /tmp/creds.txt
  4. Paste the entire output as the secret value
```

## Step 2: Create Environment in GitHub

1. Go to **Settings** → **Environments**
2. Click **New environment**
3. Name it: `production`
4. (Optional) Add deployment branch restrictions: `main`

## Step 3: Test the Workflow

1. Make a test commit:
   ```bash
   echo "# Test deployment" >> TEST.md
   git add TEST.md
   git commit -m "test: trigger GitHub Actions workflow"
   git push origin main
   ```

2. Go to repo → **Actions** tab
3. Watch the workflow run
4. Check Telegram for notification

## GitHub Actions Workflow Files

### Main Deployment (recommended)

Located at: `.github/workflows/deploy.yml`

Features:
- Deploys to Railway on every push to main
- Runs linting (optional)
- Sends Telegram notifications
- Manual trigger option (workflow_dispatch)

### Alternative: Railway Native Integration

If you prefer Railway's native GitHub integration:

1. Go to Railway Dashboard → Project
2. Click **Connect GitHub**
3. Select your repository
4. Railway will auto-deploy on push (no workflow file needed)

**Pros:** Simpler, no GitHub Actions usage
**Cons:** Less customization, less control

## Environment Variables in Railway

Railway will automatically pick up variables from:
1. Railway Dashboard **Variables** tab (highest priority)
2. `.env` file in repo (if committed - NOT RECOMMENDED for secrets)
3. GitHub Secrets (if using Actions - recommended)

### Best Practice for Production

**DO NOT commit `.env` with secrets to GitHub!**

Instead:
1. Keep `.env.example` in repo with empty values
2. Set all secrets in Railway Dashboard or GitHub Secrets
3. Railway reads from `.env` AND environment, with environment taking priority

## Manual Workflow Trigger

You can trigger deployment without pushing code:

1. Go to repo → **Actions** tab
2. Select **Deploy to Railway** workflow
3. Click **Run workflow**
4. Choose branch (main)
5. Click **Run workflow**

## Monitoring Deployments

### GitHub Actions

- Go to repo → **Actions** tab
- Click the workflow run
- View real-time logs

### Railway

- Go to Railway Dashboard → Project
- Click **Logs** tab
- Filter by time or service

### Telegram

You'll receive notifications when:
- ✅ Deployment succeeds
- ❌ Deployment fails

## Troubleshooting

### Workflow Not Running

1. Check if workflow file exists: `.github/workflows/deploy.yml`
2. Go to **Actions** tab and enable workflows if disabled
3. Verify branch is `main`

### "RAILWAY_TOKEN invalid"

1. Verify token in GitHub Secrets matches your Railway token
2. Go to railway.app → **Account Settings** → **API Tokens**
3. Check if token is still valid (not expired)
4. Regenerate if needed

### Deployment Hangs

1. Check Railway logs: `railway logs -f`
2. May be waiting for input (credentials)
3. Verify all required environment variables are set in Railway

### Telegram Notifications Not Working

1. Verify `TELEGRAM_BOT_TOKEN` in secrets
2. Verify `TELEGRAM_CHAT_ID` in secrets
3. Bot should be able to send messages to that chat ID

## Advanced: Matrix Deployments

To deploy to multiple environments (staging + production):

```yaml
jobs:
  deploy:
    strategy:
      matrix:
        environment: [staging, production]
    environment: ${{ matrix.environment }}
    steps:
      - name: Deploy to ${{ matrix.environment }}
        run: railway up --environment ${{ matrix.environment }}
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Advanced: Scheduled Deployments

Deploy on a schedule instead of push:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

## Security Best Practices

1. **Rotate tokens regularly** - Railway tokens should be rotated quarterly
2. **Use environment protection** - Restrict production deployments to specific users
3. **Enable branch protection** - Require PR reviews before merging to main
4. **Audit logs** - Check GitHub and Railway audit logs regularly
5. **Never commit secrets** - Always use GitHub Secrets, not .env files

## Cost Impact

GitHub Actions free tier includes:
- 2,000 minutes/month for public repos
- 1 deployment/push = ~2 minutes

**Estimated monthly GitHub Actions usage: ~10 minutes** (minimal)

## Next Steps

1. ✅ Add GitHub Secrets (RAILWAY_TOKEN, etc.)
2. ✅ Create GitHub Environment (production)
3. ✅ Make a test push to trigger workflow
4. ✅ Verify deployment in Railway Dashboard
5. ✅ Check Telegram for notification
6. ✅ Monitor via railway logs -f

---

For Railway CLI commands, see RAILWAY-DEPLOYMENT.md
