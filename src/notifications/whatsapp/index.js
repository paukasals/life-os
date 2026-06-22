import twilio from 'twilio';
import { config } from '../../shared/config.js';

class WhatsAppNotifier {
  constructor() {
    this.client = null;
  }

  init() {
    if (!config.whatsapp.accountSid || !config.whatsapp.authToken) {
      console.warn('[WhatsApp] No Twilio credentials configured — skipping');
      return;
    }
    this.client = twilio(config.whatsapp.accountSid, config.whatsapp.authToken);
    console.log('[WhatsApp] Notifier ready');
  }

  async send(message) {
    if (!this.client) return;
    try {
      await this.client.messages.create({
        from: config.whatsapp.from,
        to: config.whatsapp.to,
        body: message,
      });
    } catch (err) {
      console.error('[WhatsApp] Failed to send message:', err.message);
    }
  }
}

export const whatsapp = new WhatsAppNotifier();
