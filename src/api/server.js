import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import winston from 'winston';
import { orchestrator } from '../orchestrator/index.js';
import { googleCalendarService } from '../shared/google-calendar.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../src/data');
const LOGS_DIR = path.join(__dirname, '../../logs');

function ensureApiKey(req, res, next) {
  const apiKey = process.env.LIFE_OS_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server not configured: missing LIFE_OS_API_KEY' });

  const provided = req.header('x-api-key') || req.query.api_key;
  if (!provided || provided !== apiKey) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

async function ensureDataDir() {
  try {
    await fsPromises.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // ignore
  }
}

async function readJsonSafe(filename) {
  try {
    const p = path.join(DATA_DIR, filename);
    const raw = await fsPromises.readFile(p, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

async function appendJson(filename, item) {
  await ensureDataDir();
  const arr = await readJsonSafe(filename);
  arr.push(item);
  await fsPromises.writeFile(path.join(DATA_DIR, filename), JSON.stringify(arr, null, 2));
  return item;
}

export function startApiServer(port = process.env.PORT || 3000) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Ensure logs directory exists and wire request logging
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
  const accessLogStream = fs.createWriteStream(path.join(LOGS_DIR, 'access.log'), { flags: 'a' });
  app.use(morgan('combined', { stream: accessLogStream }));

  // Structured JSON logger for requests/responses
  const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.File({ filename: path.join(LOGS_DIR, 'requests.jsonl') }),
    ],
  });

  // Per-key and per-IP rate limiters
  const apiKeyLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 600, // allow more requests per API key
    keyGenerator: (req) => (req.header('x-api-key') || req.query.api_key || req.ip),
    standardHeaders: true,
    legacyHeaders: false,
  });

  const ipLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Select limiter based on presence of API key
  app.use((req, res, next) => {
    const key = req.header('x-api-key') || req.query.api_key;
    if (key) return apiKeyLimiter(req, res, next);
    return ipLimiter(req, res, next);
  });

  // Structured logging middleware (redact API keys)
  app.use((req, res, next) => {
    const start = Date.now();
    const safeHeaders = { ...req.headers };
    if (safeHeaders['x-api-key']) safeHeaders['x-api-key'] = '[redacted]';

    res.on('finish', () => {
      const duration = Date.now() - start;
      const entry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: duration,
        headers: safeHeaders,
        body: req.body,
        ip: req.ip,
      };
      try {
        logger.info(entry);
      } catch (e) {
        // ignore logging errors
      }
    });
    next();
  });

  // Health
  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/health', (req, res) => res.json({ status: 'ok' }));
  app.get('/', (req, res) => res.json({ status: 'ok', service: 'Life OS API', version: '1.0' }));

  // Protected routes
  app.post('/api/events', ensureApiKey, async (req, res) => {
    const { summary, description, start, end, calendarId } = req.body;
    try {
      const initialized = await googleCalendarService.initialize();
      if (!initialized) return res.status(500).json({ error: 'Google Calendar not initialized' });

      const event = {
        summary: summary || 'Quick Event',
        description: description || '',
        start: { dateTime: start },
        end: { dateTime: end },
      };
      const created = await googleCalendarService.createEvent(calendarId || process.env.GOOGLE_CALENDAR_ID || 'primary', event);
      return res.json({ success: !!created, event: created });
    } catch (err) {
      console.error('POST /api/events error', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/tasks', ensureApiKey, async (req, res) => {
    const { title, due, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const item = { id: Date.now(), title, due: due || null, notes: notes || '', createdAt: new Date().toISOString() };
    await appendJson('tasks.json', item);
    // Notify via orchestrator notifier if available
    try { orchestrator.ensureNotifier && orchestrator.ensureNotifier(); } catch (e) {}
    res.json({ success: true, task: item });
  });

  app.post('/api/expenses', ensureApiKey, async (req, res) => {
    const { amount, category, note, date } = req.body;
    if (typeof amount !== 'number') return res.status(400).json({ error: 'Missing amount (number)' });
    const item = { id: Date.now(), amount, category: category || 'uncategorized', note: note || '', date: date || new Date().toISOString() };
    await appendJson('expenses.json', item);
    res.json({ success: true, expense: item });
  });

  app.get('/api/briefing', ensureApiKey, async (req, res) => {
    try {
      const result = await orchestrator.runAgent('personalAssistant');
      return res.json({ success: true, briefing: result });
    } catch (err) {
      console.error('GET /api/briefing error', err);
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/run-agent', ensureApiKey, async (req, res) => {
    const { agent } = req.body;
    if (!agent) return res.status(400).json({ error: 'Missing agent name' });
    try {
      const result = await orchestrator.runAgent(agent);
      return res.json({ success: true, agent, result });
    } catch (err) {
      console.error('POST /api/run-agent error', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Convenience endpoint: POST /calendar/add (title, date HH:MM, time)
  app.post('/calendar/add', ensureApiKey, async (req, res) => {
    const { title, date, time, description } = req.body;
    if (!title || !date || !time) return res.status(400).json({ error: 'Missing title, date (YYYY-MM-DD), or time (HH:MM)' });

    try {
      const initialized = await googleCalendarService.initialize();
      if (!initialized) return res.status(500).json({ error: 'Google Calendar not initialized' });

      // Parse date (YYYY-MM-DD) and time (HH:MM)
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour duration

      const event = {
        summary: title,
        description: description || '',
        start: { dateTime: startDateTime.toISOString() },
        end: { dateTime: endDateTime.toISOString() },
      };

      const created = await googleCalendarService.createEvent(
        process.env.GOOGLE_CALENDAR_ID || 'primary',
        event
      );
      return res.json({ success: !!created, event: created });
    } catch (err) {
      console.error('POST /calendar/add error', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Convenience endpoint: POST /task/add
  app.post('/task/add', ensureApiKey, async (req, res) => {
    const { title, due, notes } = req.body;
    if (!title) return res.status(400).json({ error: 'Missing title' });
    const item = { id: Date.now(), title, due: due || null, notes: notes || '', createdAt: new Date().toISOString() };
    await appendJson('tasks.json', item);
    res.json({ success: true, task: item });
  });

  // Convenience endpoint: POST /agent/run
  app.post('/agent/run', ensureApiKey, async (req, res) => {
    const { agent } = req.body;
    if (!agent) return res.status(400).json({ error: 'Missing agent name' });
    try {
      const result = await orchestrator.runAgent(agent);
      return res.json({ success: true, agent, result });
    } catch (err) {
      console.error('POST /agent/run error', err);
      return res.status(500).json({ error: err.message });
    }
  });

  // Basic listing endpoints
  app.get('/api/tasks', ensureApiKey, async (req, res) => {
    const items = await readJsonSafe('tasks.json');
    res.json({ tasks: items });
  });

  app.get('/api/expenses', ensureApiKey, async (req, res) => {
    const items = await readJsonSafe('expenses.json');
    res.json({ expenses: items });
  });

  const server = app.listen(port, () => {
    console.log(`[API] Life OS API listening on port ${port}`);
  });

  return server;
}
