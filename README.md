# 🧠 Life OS — Your Personal & Business Orchestration System

Welcome, Pau! Your Life OS is a **master orchestrator** that coordinates all aspects of your personal and business life using Claude AI. It sends you daily briefings, tracks health, manages businesses, and keeps everything aligned.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         MasterOrchestrator (Brain)                          │
│  Runs agents on schedules, coordinates everything          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├── 7:00 AM ← Personal Assistant (Morning Briefing) ⭐
             ├── 7:00 AM ← Health & Wellness (Training readiness)
             ├── 7:00 AM ← Meal Planning (High-protein meals)
             ├── 7:00 AM ← Sleep & Recovery (Last night's data)
             ├── 7:00 AM ← Doctor Appointments (Reminders)
             │
             ├── 8:30 AM (Weekdays) ← Business Morning
             │   ├── Revenue Dashboard
             │   ├── Finance Report
             │   ├── Marketing Review
             │   ├── Ads Manager (auto-pause on CAC guardrail)
             │   ├── Inventory Check
             │   └── Employee Management
             │
             ├── 9:00 AM (Weekdays) ← Content Calendar (drafts + can auto-post)
             ├── Every 4 hours ← Review Responder (drafts + can auto-post)
             │
             └── Output: Telegram notifications 📱
```

## 🎯 Your Daily Workflow

### Morning Briefing (7:00 AM)
Your **Personal Assistant** synthesizes insights from all agents:
- **Priority Matrix**: Top 3 things to focus on
- **Daily Schedule**: Morning prep, business execution, evening wind-down
- **One Thing to Protect**: Your deep work or rest time

Example:
```
🌅 MORNING BRIEFING — Monday, June 22

PRIORITY MATRIX
1. Check Lobsteria sales + The Crepes & Waffles numbers
2. Prepare for water polo (Saturday only) OR track HIIT session
3. Catch up on customer reviews

DAILY SCHEDULE
- 7:00 AM: Meal 1 (high protein + whey shake) + Supplements
- 9:00 AM: Business execution block
- 1:00 PM: Meal 2 (high protein + recovery)
- 3:00 PM: Deep work or training
- 6:00 PM: Wind-down + review

PROTECT TIME FOR
- 2-hour focus block, 9-11 AM
```

### Business Morning (8:30 AM, Weekdays)
- **Revenue Dashboard**: Sales performance vs target
- **Finance Report**: Cash position, margins, opportunities
- **Marketing Review**: Ad performance, top channels
- **Inventory Check**: Stock alerts, reorder needs
- **Employee Management**: Team attendance, staffing

### Throughout the Day
- **Customer Review Monitor**: Real-time reputation tracking every 4 hours
- **Content Calendar**: Publishing reminders (weekdays at 9 AM)

## 🏥 Personal Health Agents

### Health & Wellness (Daily, 7 AM)
Tracks your training readiness:
- **Training Protocol**: 3x HIIT + Zone 2 cardio weekly + Water polo Saturdays
- **Readiness Score**: Can you train hard today?
- **Supplement Reminder**: Omega-3, D3+K2, Multivitamin, Creatine, Whey Protein

### Meal Planning (Daily, 7 AM)
Designs your 2-meal-per-day high-protein diet:
- **Meal 1**: Breakfast (1000-1200 cal, high protein + carbs)
- **Meal 2**: Dinner (1000-1200 cal, protein + vegetables)
- Leverages Lobsteria ingredients (oysters, lobster, ceviche)

### Sleep & Recovery (Daily, 7 AM)
Monitors sleep quality and recovery:
- Sleep score interpretation
- What it means for today's performance
- One action to improve tonight's sleep

### Doctor Appointments (As needed)
Tracks medical appointments within 2 weeks:
- Reminders 7-14 days before
- Prep checklist (documents, questions)
- Sports medicine focused (for your training load)

## 💼 Business Agents

### Revenue Dashboard (8:30 AM, Weekdays)
Two revenue streams:
1. **Lobsteria**: Airstream food truck (direct sales, catering)
2. **The Crepes & Waffles Bar**: Walk-in, events, catering

Tracks: Daily revenue, MTD vs target, top products, opportunities to scale.

### Finance Agent (8:30 AM, Weekdays)
Monitors:
- Daily cash position
- Revenue vs forecast
- Cost of goods sold (seafood, ingredients)
- Labor and overhead
- Profitability by location

### Marketing Agent (8:30 AM, Weekdays)
Analyzes:
- Google Ads performance (local search)
- Meta Ads (location-based, seasonal)
- Organic social (Instagram, TikTok, LinkedIn)
- CAC, repeat rate, AOV tracking

Sits above the three execution agents below — Review Responder, Content Calendar, and Ads Manager — and
synthesizes what they're doing into one report.

## 🤖 Marketing Autopilot

Three agents can take real action on Lobsteria's behalf, not just report:

| Agent | What it does live | Channel switch |
|---|---|---|
| **Review Responder** (`reviewMonitor`, every 4h) | Fetches unanswered Google reviews, drafts on-brand replies, posts them | `MARKETING_AUTOPILOT_REVIEWS` |
| **Content Calendar** (`contentCalendar`, 9 AM weekdays) | Drafts a caption for the next queued post, publishes it to TikTok | `MARKETING_AUTOPILOT_SOCIAL` |
| **Ads Manager** (`adsManager`, 8:30 AM weekdays) | Pauses a campaign if its trailing CAC breaches `AD_MAX_CAC` — nothing else | `MARKETING_AUTOPILOT_ADS` |

**Everything defaults to `dry-run`.** Agents draft replies/captions and report what they *would* do via
Telegram, but nothing posts publicly or spends money until you flip the switch:

```bash
# Global default for all three channels
MARKETING_AUTOPILOT=dry-run   # or: live

# Or go live per channel (overrides the global default)
MARKETING_AUTOPILOT_REVIEWS=live
MARKETING_AUTOPILOT_SOCIAL=live
MARKETING_AUTOPILOT_ADS=live
```

Each channel also needs its own credentials before it can act live — see `.env.example` for
`GBP_CLIENT_ID`/`GBP_CLIENT_SECRET`/`GBP_REFRESH_TOKEN` (reviews), `TIKTOK_ACCESS_TOKEN` (social), and
`META_ACCESS_TOKEN`/`META_AD_ACCOUNT_ID` or the `GOOGLE_ADS_*` vars (ads). Missing credentials means the
agent no-ops and says so in its Telegram report — it never fails silently or fakes an action.

**Feeding the content queue**: Content Calendar can write captions but can't shoot footage. Drop a finished
photo/video (already hosted at a public URL, same as the old manual TikTok workflow) into the queue and the
agent picks it up on its next run:

```bash
curl -X POST http://localhost:3000/api/content-queue \
    -H "Content-Type: application/json" \
    -H "x-api-key: $LIFE_OS_API_KEY" \
    -d '{"platform":"tiktok","mediaUrl":"https://lobsteria.co/uploads/.../photo.jpg","idea":"Maine lobster roll, brown butter close-up","mediaType":"PHOTO"}'
```

**Ads Manager guardrail**: the only live action it ever takes on its own is pausing a campaign whose 7-day
CAC exceeds `AD_MAX_CAC`. It never increases budget or reallocates spend automatically — those stay
recommendations in its report for Pau to approve.

### Inventory Agent (8:30 AM, Weekdays)
Tracks stock by business:
- **Lobsteria**: Lobster, oysters, ceviche mix, supplies
- **The Crepes & Waffles Bar**: Batter, fillings, toppings
- Alerts on low stock, overstock, cost optimization

### Review Responder (Every 4 hours)
Fetches unanswered Google Business Profile reviews for Lobsteria, drafts an on-brand reply for each
(warm and specific for positive reviews, an apology + direct contact for 1-3★), and — once
`MARKETING_AUTOPILOT_REVIEWS=live` and GBP credentials are set — posts the replies automatically.
Dry-run drafts everything and reports it via Telegram without posting.

### Content Calendar (9:00 AM, Weekdays)
Reviews the content queue for posting gaps and suggests what to shoot next. When there's a queued,
ready-to-post item (see **Marketing Autopilot** above), it drafts a platform-native caption and —
in live mode — publishes it to TikTok. Human still shoots the footage; the agent handles strategy,
copy, and (optionally) the publish step.

### Employee Management (8:30 AM, Weekdays)
Tracks team across two locations:
- Who's in/out today
- Staffing coverage
- High-performers & concerns
- People-management priorities

## 🚀 Setup Instructions

### 1. Local Development

```bash
# Install dependencies
npm install

# Copy .env.example to .env (already configured)
# Update any missing API keys

# Run the orchestrator in "dev" mode (watches for changes)
npm run dev

# Or run once
npm start
```

### 2. Run Individual Agents

```bash
# Test the Personal Assistant (morning briefing)
node index.js run personalAssistant

# Test any agent
node index.js run [agentName]

# Camel case: personalAssistant, healthWellness, mealPlanning, etc.
```

### 3. Deploy to Railway

#### Option A: Connect GitHub
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select this repo
5. Railway auto-detects Node.js

#### Option B: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

#### Environment Variables on Railway
Add these in Railway dashboard (Project Settings → Variables):
- `ANTHROPIC_API_KEY` ✅ (already in .env)
- `TELEGRAM_BOT_TOKEN` ✅ (already in .env)
- `TELEGRAM_CHAT_ID` ✅ (already in .env)
- All other API keys from `.env.example`

#### Verify Deployment
```bash
# View logs
railway logs

# SSH into container
railway shell
```

## 📊 Next Steps: Integration Checklist

To fully activate your Life OS, integrate these APIs:

### 🏥 Health APIs (Optional but powerful)
- [ ] **Oura Ring**: HRV, sleep, readiness data
- [ ] **Apple Health**: Activity, steps, heart rate
- [ ] **Whoop**: Recovery, strain, sleep analysis

### 📅 Calendar APIs (Enables smart scheduling)
- [ ] **Google Calendar**: Fetch meetings, deadlines, water polo games
- [ ] Set up calendar with recurring events

### 💰 Finance APIs (Real revenue tracking)
- [ ] **Stripe**: Connect payment processing
- [ ] **Square**: Connect POS system (if using)
- [ ] **Bank API**: Connect business bank account

### 📢 Marketing APIs (Ad performance + auto-pause guardrail)
- [ ] **Google Ads API**: `GOOGLE_ADS_DEVELOPER_TOKEN` + OAuth client (`GOOGLE_ADS_CLIENT_ID/SECRET/REFRESH_TOKEN`) + `GOOGLE_ADS_CUSTOMER_ID`
- [ ] **Meta Marketing API**: `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID`

### ⭐ Review APIs (auto-reply)
- [ ] **Google Business Profile API**: `GBP_CLIENT_ID/SECRET/REFRESH_TOKEN` — powers the Review Responder agent
- [ ] **Yelp API**: Review monitoring (not yet wired to an agent)

### 🎤 Social Media APIs (auto-post)
- [ ] **TikTok Content Posting API**: `TIKTOK_ACCESS_TOKEN` — powers the Content Calendar agent's live posting
- [ ] **Instagram Graph API**: Post scheduling, analytics (not yet wired to an agent)

### 👥 HR/Inventory APIs (Team & stock)
- [ ] **Gusto or BambooHR**: Team scheduling, payroll
- [ ] **Square Inventory**: Stock tracking
- [ ] **Shopify API**: If using Shopify for any channel

## 🧪 Testing the System

```bash
# Test all agents once
node index.js run-all

# Watch for changes (development)
npm run dev

# Check logs
tail -f logs/life-os.log
```

## 📝 Example Output

When you run the Personal Assistant at 7 AM, you'll receive a Telegram message like:

```
🌅 MORNING BRIEFING — Monday, June 22

PRIORITY MATRIX
1. Check Lobsteria + Crepes sales for the day
2. Prepare high-protein meal 1 + take supplements
3. Review customer feedback from weekend

DAILY SCHEDULE
- 7:00 AM: Meal 1 (eggs + avocado + protein) + Omega-3, D3+K2, Multivitamin, Creatine, Whey shake
- 9:00 AM: Business review block (revenue, marketing, inventory)
- 1:00 PM: Meal 2 (oyster ceviche + grilled fish + salad)
- 3:00 PM: HIIT training session
- 6:00 PM: Wind-down, review team performance

PROTECT TIME FOR
- 2-hour deep work block, 9-11 AM (no interruptions)
```

## 🔐 Security Best Practices

1. **Never commit `.env`** (it's in `.gitignore`)
2. **Use Railway's secret management** for all API keys
3. **Rotate API keys quarterly**
4. **Monitor Telegram for unusual activity** (agent misbehavior)
5. **Enable 2FA** on all connected service accounts

## 📞 Troubleshooting

### "Unknown agent: personalAssistant"
- Make sure you're using camelCase: `personalAssistant`, not `personal-assistant`

### "invalid x-api-key"
- Check that `ANTHROPIC_API_KEY` is valid in `.env`
- Regenerate key from [console.anthropic.com](https://console.anthropic.com)

### "Telegram not sending"
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correct
- Test with: `curl -X POST https://api.telegram.org/bot{TOKEN}/sendMessage -d "chat_id={ID}&text=test"`

### No logs appearing
- Check logs in `logs/` folder
- For Railway deployment, use `railway logs`

## 🎯 Philosophy

Your Life OS is built on these principles:

1. **Synthesis over noise**: All agents feed into one morning briefing
2. **Action over reporting**: Every message suggests one thing to do
3. **Context matters**: Everything knows you're Pau, what you do, how you train
4. **Automation where it counts**: Schedules, reminders, alerts
5. **Human judgment rules**: AI suggests, you decide

## API Usage

Life OS exposes a small HTTP API for remote control. Start the app and set `LIFE_OS_API_KEY` in your environment.

Examples (replace `$LIFE_OS_API_KEY` with the key):

```bash
# Health check
curl -X GET http://localhost:3000/api/health

# Create a task
curl -X POST http://localhost:3000/api/tasks \
    -H "Content-Type: application/json" \
    -H "x-api-key: $LIFE_OS_API_KEY" \
    -d '{"title":"Check Lobsteria inventory","due":"2026-06-23"}'

# Get today's briefing
curl -X GET http://localhost:3000/api/briefing -H "x-api-key: $LIFE_OS_API_KEY"

# Create calendar event
curl -X POST http://localhost:3000/api/events \
    -H "Content-Type: application/json" \
    -H "x-api-key: $LIFE_OS_API_KEY" \
    -d '{"summary":"Call with supplier","start":"2026-06-23T15:00:00-04:00","end":"2026-06-23T15:30:00-04:00"}'
```

## 📚 Architecture Notes

- **BaseAgent**: All agents inherit from this, implement `run()` and `fetchData()`
- **MasterOrchestrator**: Manages schedules via `node-cron`, coordinates all agents
- **Notifier**: Sends to Telegram (+ WhatsApp fallback)
- **Config**: Centralized user profile & business context

---

**Welcome to your automated life, Pau.** Your system is ready to run. Deploy it, test the morning briefing, and enjoy the intelligence.

For questions or improvements, check `src/agents/*/index.js` and adapt as needed.

🚀
