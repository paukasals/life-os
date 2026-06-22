import TelegramBot from 'node-telegram-bot-api';
import { config } from '../../shared/config.js';

class TelegramNotifier {
  constructor() {
    this.bot = null;
    this.chatId = config.telegram.chatId;
  }

  init() {
    if (!config.telegram.token) {
      console.warn('[Telegram] No token configured — skipping');
      return;
    }
    this.bot = new TelegramBot(config.telegram.token, { polling: false });
    console.log('[Telegram] Notifier ready');
  }

  async send(message) {
    if (!this.bot) return;
    try {
      await this.bot.sendMessage(this.chatId, message, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('[Telegram] Failed to send message:', err.message);
    }
  }

  async sendPhoto(photoUrl, caption = '') {
    if (!this.bot) return;
    await this.bot.sendPhoto(this.chatId, photoUrl, { caption });
  }
}

export const telegram = new TelegramNotifier();
