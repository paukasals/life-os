import { telegram } from './telegram/index.js';
import { whatsapp } from './whatsapp/index.js';

class Notifier {
  init() {
    telegram.init();
    whatsapp.init();
  }

  async send(message, channel = 'both') {
    const tasks = [];
    if (channel === 'telegram' || channel === 'both') tasks.push(telegram.send(message));
    if (channel === 'whatsapp' || channel === 'both') tasks.push(whatsapp.send(message));
    await Promise.allSettled(tasks);
  }
}

export const notifier = new Notifier();
