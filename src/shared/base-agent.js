import Anthropic from '@anthropic-ai/sdk';
import { notifier } from '../notifications/index.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export class BaseAgent {
  constructor(name, systemPrompt) {
    this.name = name;
    this.systemPrompt = systemPrompt;
    this.model = 'claude-opus-4-8';
    this._hasNotified = false;
  }

  async think(userMessage, tools = []) {
    const params = {
      model: this.model,
      max_tokens: 4096,
      system: this.systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    };
    if (tools.length > 0) params.tools = tools;

    const response = await client.messages.create(params);
    return response;
  }

  async run() {
    throw new Error(`Agent "${this.name}" must implement run()`);
  }

  async notify(message, channel = 'both') {
    const formatted = `[${this.name}] ${message}`;
    await notifier.send(formatted, channel);
    this._hasNotified = true;
  }

  resetNotificationState() {
    this._hasNotified = false;
  }

  get hasNotified() {
    return this._hasNotified;
  }

  log(message) {
    console.log(`[${new Date().toISOString()}] [${this.name}] ${message}`);
  }

  error(message, err) {
    console.error(`[${new Date().toISOString()}] [${this.name}] ERROR: ${message}`, err ?? '');
  }
}
