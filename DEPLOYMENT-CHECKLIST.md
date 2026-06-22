# Life OS Deployment Checklist

Complete this checklist to fully deploy Life OS to Railway with Google Calendar integration and CI/CD automation.

## Phase 1: Local Setup ✅

- [x] Install Node.js 20+
- [x] Install googleapis package
- [x] Create google-calendar.js service
- [x] Update doctor-appointments agent
- [x] Create setup-google-calendar.js script
- [x] Create init-credentials.js
- [x] Update index.js with credential initialization
- [x] Update .gitignore

## Phase 2: Google Calendar Authentication

### Local

- [ ] Have your Google Account ready
- [ ] Run: `node setup-google-calendar.js`
- [ ] Authenticate with Google
- [ ] Verify credentials.json is created
- [ ] Test: `npm start` (should see Doctor Appointments agent running)

### Production (Railway)

- [ ] Encode credentials: `cat credentials.json | base64 | pbcopy`
- [ ] Keep base64 string safe (needed for GitHub Secrets)

## Phase 3: GitHub Setup

- [ ] Go to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Add secret: `RAILWAY_TOKEN`
  - Get from: railway.app → Account Settings → API Tokens
- [ ] Add optional secrets for notifications:
  - [ ] `TELEGRAM_BOT_TOKEN` (from your .env)
  - [ ] `TELEGRAM_CHAT_ID` (from your .env)
- [ ] Add optional secret for credentials:
  - [ ] `GOOGLE_CREDENTIALS_BASE64` (base64-encoded credentials.json)

## Phase 4: Railway Setup

### Account & Project

- [ ] Sign up for Railway.app (if not done)
- [ ] Create new project: "Life OS"
- [ ] Note your project ID
- [ ] Get API token for GitHub integration

### Environment Variables

In Railway Dashboard → Variables:

```env
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Telegram
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...

# Business
BUSINESS_NAME=Lobsteria & The Crepes & Waffles Bar
TIMEZONE=America/New_York

# Google Calendar
GOOGLE_CALENDAR_CREDENTIALS_PATH=./credentials.json
GOOGLE_CALENDAR_ID=primary
GOOGLE_CLIENT_ID=<your-client-id-from-google-cloud>
GOOGLE_CLIENT_SECRET=<your-client-secret-from-google-cloud>
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Google Credentials (for CI/CD initialization)
GOOGLE_CREDENTIALS_BASE64=<paste_base64_here>

# Health
APPLE_HEALTH_API_KEY=

# Marketing
GOOGLE_ADS_API_KEY=
META_ACCESS_TOKEN=

# Finance
STRIPE_SECRET_KEY=
BANK_API_KEY=

# Reviews
GOOGLE_PLACES_API_KEY=
TRUSTPILOT_API_KEY=
```

### GitHub Integration

- [ ] Go to Railway project → Settings → GitHub
- [ ] Connect your GitHub repo: `paukasals/life-os`
- [ ] Enable automatic deployments on push
- [ ] Select branch: `main`

## Phase 5: GitHub Actions Workflow

- [ ] Verify `.github/workflows/deploy.yml` exists
- [ ] Make test commit and push:
  ```bash
  git add .
  git commit -m "feat: add Railway deployment automation"
  git push origin main
  ```
- [ ] Go to GitHub → Actions tab
- [ ] Verify workflow runs successfully
- [ ] Check Telegram for deployment notification
- [ ] Verify in Railway Dashboard → Logs

## Phase 6: Testing & Verification

### Local Testing

```bash
# Test credential initialization from base64
GOOGLE_CREDENTIALS_BASE64=$(cat credentials.json | base64) npm start

# Test credential initialization from env vars
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... npm start

# Run specific agent
node index.js run doctor-appointments

# Run all agents once
node index.js run-all
```

### Railway Testing

```bash
# SSH into Railway environment
railway shell

# Check if credentials.json exists and is valid
cat credentials.json | head -10

# Check application logs
railway logs -n 100 -f

# Check running processes
ps aux | grep node

# Restart if needed
railway restart
```

### Verification Points

- [ ] Application starts without errors
- [ ] Google Calendar credentials load successfully
- [ ] Doctor Appointments agent can fetch events
- [ ] Telegram notifications work
- [ ] All agents run at scheduled times
- [ ] Logs are written correctly

## Phase 7: Monitoring & Maintenance

### Daily

- [ ] Check Telegram notifications
- [ ] Verify agents are running as scheduled

### Weekly

- [ ] Review Railway logs for errors
- [ ] Check CPU/Memory usage
- [ ] Verify no unhandled exceptions

### Monthly

- [ ] Rotate API tokens
- [ ] Review and update environment variables if needed
- [ ] Check cost on Railway

## Phase 8: Cleanup & Security

- [ ] Remove TEST.md or any test files
- [ ] Verify credentials.json is NOT in git:
  ```bash
  git check-ignore credentials.json  # Should return credentials.json
  ```
- [ ] Verify .google-calendar-token.json is NOT in git:
  ```bash
  git check-ignore .google-calendar-token.json
  ```
- [ ] Verify .env is NOT in git (if it contains secrets)
- [ ] Review .gitignore to ensure all secrets are covered
- [ ] Enable branch protection on main in GitHub

## Troubleshooting

### Problem: "credentials.json not found"

**Solution:**
- [ ] Verify `GOOGLE_CREDENTIALS_BASE64` is set in Railway Variables
- [ ] OR verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- [ ] Restart Railway: `railway restart`
- [ ] Check logs: `railway logs -f`

### Problem: GitHub Actions workflow fails

**Solution:**
- [ ] Verify `RAILWAY_TOKEN` is correct and not expired
- [ ] Verify railway.json exists
- [ ] Check workflow logs in GitHub Actions tab
- [ ] Run locally first: `npm start`

### Problem: Doctor Appointments agent not picking up events

**Solution:**
- [ ] Create test event in Google Calendar with "Doctor" in title
- [ ] Run: `node index.js run doctor-appointments`
- [ ] Check console output for event list
- [ ] Verify event has medical keywords (doctor, appointment, physical, checkup, medical, sports medicine)

### Problem: Telegram notifications not arriving

**Solution:**
- [ ] Verify bot token is correct
- [ ] Verify chat ID is correct
- [ ] Test locally: `npm start`
- [ ] Check if bot has permission to send messages in that chat

## Documentation Files

- `GOOGLE-CALENDAR-SETUP.md` - Google Calendar OAuth setup
- `RAILWAY-DEPLOYMENT.md` - Railway deployment guide
- `GITHUB-ACTIONS-SETUP.md` - GitHub Actions CI/CD setup
- `INTEGRATION-GUIDE.md` - Finance & Marketing API integration

## Success Criteria

✅ You've successfully deployed when:

1. Application runs on Railway without errors
2. Doctor Appointments agent runs at 8:30 AM daily
3. Medical appointments appear on calendar
4. Telegram reminders are sent
5. GitHub Actions automatically deploys on push
6. You receive deployment notifications
7. All sensitive data is secure and not in git

## Emergency Procedures

### Rollback to Previous Version

```bash
# View recent commits
git log --oneline -n 10

# Revert to previous commit
git revert <commit-hash>
git push origin main

# Railway will automatically re-deploy
```

### Emergency Disable Deployments

```bash
# In GitHub: go to Settings → Branch protection rules
# Disable automatic deployments if needed
```

### Restart Application

```bash
railway restart
# or from dashboard: Click restart button
```

---

**Estimated Time:** 1-2 hours total
**Difficulty:** Intermediate (mostly configuration)
**Support:** Check documentation files for detailed steps

Next: Follow the phases in order. Start with Phase 1 verification if not already done.
