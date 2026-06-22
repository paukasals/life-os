# Integration Guide: Finance & Marketing Systems

Your Life OS is ready to receive data from your separate Claude Code sessions for Marketing (terminal) and Finance (cloud).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         Life OS Orchestrator (Main)                         │
│         Running on Railway / Local                          │
└────────────┬────────────────────────────────────────────────┘
             │
             ├── 8:30 AM ← Finance Agent
             │   └── Calls: Your Finance Cloud System via API
             │
             └── 8:30 AM ← Marketing Agent  
                 └── Calls: Your Marketing Terminal via API/Webhook
```

## Option 1: REST API Integration (Recommended)

### Finance System (Cloud)
If your Finance system is deployed on Railway or another cloud platform:

**Step 1: Expose a JSON endpoint**
```javascript
// In your Finance system
app.get('/api/snapshot', (req, res) => {
  res.json({
    lobsteria: { revenue: 2500, expenses: 800, margin: 68 },
    crepeswaffles: { revenue: 1800, expenses: 450, margin: 75 },
    combined: {
      cashBalance: 15000,
      monthlyRevenue: 65000,
      monthlyExpenses: 18000,
      runway: 3.6 // months
    },
    date: '2026-06-22'
  });
});
```

**Step 2: Update Finance Agent in Life OS**
```javascript
// src/agents/finance/index.js → fetchFinancials()

async fetchFinancials() {
  try {
    const FINANCE_API_URL = process.env.FINANCE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${FINANCE_API_URL}/api/snapshot`);
    if (!response.ok) throw new Error('Finance API unreachable');
    return await response.json();
  } catch (err) {
    this.error('Finance API call failed', err);
    return null; // Skip reporting if API is down
  }
}
```

**Step 3: Add environment variable**
```bash
# .env
FINANCE_API_URL=https://your-finance-system.railway.app
```

### Marketing System (Terminal)

**Step 1: Expose a REST endpoint**
```javascript
// In your Marketing Terminal system
app.get('/api/metrics', (req, res) => {
  res.json({
    google: { spend: 450, clicks: 1200, conversions: 45, cac: 10 },
    meta: { spend: 300, reach: 8000, engagements: 450, cpc: 0.67 },
    organic: { followers: 2100, engagement_rate: 3.2, topPost: 'Oyster special' },
    date: '2026-06-22'
  });
});
```

**Step 2: Update Marketing Agent in Life OS**
```javascript
// src/agents/marketing/index.js → fetchMetrics()

async fetchMetrics() {
  try {
    const MARKETING_API_URL = process.env.MARKETING_API_URL || 'http://localhost:3000';
    const response = await fetch(`${MARKETING_API_URL}/api/metrics`);
    if (!response.ok) throw new Error('Marketing API unreachable');
    return await response.json();
  } catch (err) {
    this.error('Marketing API call failed', err);
    return null;
  }
}
```

**Step 3: Add environment variable**
```bash
# .env
MARKETING_API_URL=http://localhost:3000  # Local during dev
# Or for cloud deployment:
MARKETING_API_URL=https://your-marketing-system.railway.app
```

---

## Option 2: Webhook Integration

If your existing systems **push** data instead of being called:

### Finance System Pushes Updates
```javascript
// Your Finance system (cloud)
setInterval(async () => {
  const snapshot = await generateFinanceSnapshot();
  
  // POST to Life OS
  await fetch('https://your-life-os.railway.app/webhooks/finance', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.WEBHOOK_SECRET}` },
    body: JSON.stringify(snapshot)
  });
}, 3600000); // Every hour
```

### Life OS Receives Webhook
```javascript
// src/webhooks/finance.js
app.post('/webhooks/finance', (req, res) => {
  const latestFinanceData = req.body;
  cache.set('finance-snapshot', latestFinanceData);
  res.json({ ok: true });
});

// Finance Agent then reads from cache
async fetchFinancials() {
  const cached = cache.get('finance-snapshot');
  return cached || null;
}
```

---

## Option 3: Shared Module / Monorepo

If you migrate Finance/Marketing into the same Life OS repo:

```
life-os/
├── src/
│   ├── agents/
│   ├── finance-module/  ← Your finance logic
│   ├── marketing-module/ ← Your marketing logic
│   └── ...
```

Then import directly:
```javascript
// src/agents/finance/index.js
import { getFinanceSnapshot } from '../../finance-module/api.js';

async fetchFinancials() {
  return await getFinanceSnapshot();
}
```

---

## Implementation Steps

### For YOUR existing Finance system (cloud):

1. **Add a GET endpoint** that returns the JSON snapshot
2. **Deploy to Railway** (it's already there)
3. **Get the public URL**: `https://your-finance-railway-app.railway.app`
4. **Share the endpoint URL** with me
5. I'll update `src/agents/finance/index.js` to call it

### For YOUR existing Marketing system (terminal):

1. **Add a GET endpoint** that returns marketing metrics
2. **If deployed to cloud**: Get the public URL
3. **If running locally**: Use `http://localhost:PORT`
4. **Share the URL/port** with me
5. I'll update `src/agents/marketing/index.js` to call it

---

## Testing the Integration

Once you've exposed the endpoints:

```bash
# Test Finance endpoint
curl https://your-finance-system.railway.app/api/snapshot

# Test Marketing endpoint
curl http://localhost:3000/api/metrics  # or your public URL

# Then test the agents
node index.js run financeAgent
node index.js run marketingAgent
```

---

## Data Schema Expected

### Finance Snapshot
```json
{
  "lobsteria": {
    "revenue": 2500,
    "expenses": 800,
    "margin": 68
  },
  "crepeswaffles": {
    "revenue": 1800,
    "expenses": 450,
    "margin": 75
  },
  "combined": {
    "cashBalance": 15000,
    "monthlyRevenue": 65000,
    "monthlyExpenses": 18000,
    "runway": 3.6
  },
  "date": "2026-06-22"
}
```

### Marketing Metrics
```json
{
  "google": {
    "spend": 450,
    "clicks": 1200,
    "conversions": 45,
    "cac": 10
  },
  "meta": {
    "spend": 300,
    "reach": 8000,
    "engagements": 450,
    "cpc": 0.67
  },
  "organic": {
    "followers": 2100,
    "engagement_rate": 3.2,
    "topPost": "Oyster special"
  },
  "date": "2026-06-22"
}
```

---

## Fallback Behavior

If either system is down or unreachable:
- Agent logs a warning
- Skips that section of the morning briefing
- Continues with other agents
- No Telegram alert (graceful degradation)

---

## Next Steps

1. **Share your Finance system details**: URL + endpoint path
2. **Share your Marketing system details**: URL/port + endpoint path
3. **I'll update both agents** to integrate
4. **Test together** for the next morning briefing

Your Life OS is **ready to deploy** — integration can happen anytime without disrupting the rest of the system.
