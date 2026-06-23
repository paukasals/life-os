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
             │   ├── Inventory Check
             │   └── Employee Management
             │
             ├── 9:00 AM (Weekdays) ← Content Calendar
             ├── Every 4 hours ← Customer Review Monitor
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

### Inventory Agent (8:30 AM, Weekdays)
Tracks stock by business:
- **Lobsteria**: Lobster, oysters, ceviche mix, supplies
- **The Crepes & Waffles Bar**: Batter, fillings, toppings
- Alerts on low stock, overstock, cost optimization

### Customer Review Monitor (Every 4 hours)
Monitors reviews across:
- Google (Lobsteria & Crepes location pages)
- Yelp
- Instagram DMs & comments
- TikTok engagement

Surfaces: Sentiment, recurring themes, response drafts.

### Content Calendar (9:00 AM, Weekdays)
Manages social media posting:
- **Platforms**: Instagram (Reels/photos), TikTok (food prep), LinkedIn (entrepreneur journey)
- **Content angles**: Fresh ingredients, Airstream culture, seasonal, customer stories
- Flags posting gaps, suggests viral ideas

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

### 📢 Marketing APIs (Ad performance)
- [ ] **Google Ads API**: Campaign performance, ROAS
- [ ] **Meta Marketing API**: Facebook/Instagram ad metrics

### ⭐ Review APIs (Reputation tracking)
- [ ] **Google Places API**: Lobsteria & Crepes location reviews
- [ ] **Yelp API**: Review monitoring

### 🎤 Social Media APIs (Content scheduling)
- [ ] **Instagram Graph API**: Post scheduling, analytics
- [ ] **TikTok API**: Video analytics

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
