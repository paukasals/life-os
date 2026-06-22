export function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: process.env.TIMEZONE || 'UTC',
  }).format(date instanceof Date ? date : new Date(date));
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function truncate(str, max = 200) {
  return str.length > max ? str.slice(0, max) + '...' : str;
}
