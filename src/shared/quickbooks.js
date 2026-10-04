import OAuthClient from 'intuit-oauth';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = process.env.QUICKBOOKS_TOKENS_PATH || path.join(__dirname, '../../.quickbooks-tokens.json');
const REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/auth/quickbooks/callback';
const ENVIRONMENT = process.env.QUICKBOOKS_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
const API_BASE = ENVIRONMENT === 'production'
  ? 'https://quickbooks.api.intuit.com'
  : 'https://sandbox-quickbooks.api.intuit.com';

function makeClient() {
  const clientId = process.env.QUICKBOOKS_CLIENT_ID;
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  return new OAuthClient({
    clientId,
    clientSecret,
    environment: ENVIRONMENT,
    redirectUri: REDIRECT_URI,
  });
}

// Each QuickBooks-connected business (Lobsteria, The Crepes & Waffles Bar, ...) is a
// separate QuickBooks Online company with its own OAuth grant, so tokens are keyed by
// an arbitrary business key (see setup-quickbooks.js) and stored together in one file.
class QuickBooksService {
  constructor() {
    this._tokens = null;
  }

  async _loadTokens() {
    if (this._tokens) return this._tokens;
    try {
      const raw = await fs.readFile(TOKENS_PATH, 'utf-8');
      this._tokens = JSON.parse(raw);
    } catch (err) {
      this._tokens = {};
    }
    return this._tokens;
  }

  async _saveTokens() {
    await fs.writeFile(TOKENS_PATH, JSON.stringify(this._tokens, null, 2));
  }

  async isConfigured(businessKey) {
    const tokens = await this._loadTokens();
    return Boolean(tokens[businessKey]?.refresh_token && tokens[businessKey]?.realm_id);
  }

  async configuredBusinessKeys() {
    const tokens = await this._loadTokens();
    return Object.keys(tokens).filter((key) => tokens[key]?.refresh_token);
  }

  getAuthUrl(businessKey) {
    const client = makeClient();
    if (!client) throw new Error('QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET not set');

    return client.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: businessKey,
    });
  }

  async saveTokenFromCallbackUrl(callbackUrl, businessKey) {
    const client = makeClient();
    if (!client) throw new Error('QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET not set');

    const authResponse = await client.createToken(callbackUrl);
    const token = authResponse.getJson();
    const realmId = client.token.realmId;
    if (!realmId) throw new Error('QuickBooks callback did not include a realmId');

    const tokens = await this._loadTokens();
    tokens[businessKey] = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      realm_id: realmId,
      expires_at: Date.now() + token.expires_in * 1000,
      refresh_token_expires_at: Date.now() + token.x_refresh_token_expires_in * 1000,
    };
    this._tokens = tokens;
    await this._saveTokens();
    return { realmId };
  }

  async _ensureFreshToken(businessKey) {
    const tokens = await this._loadTokens();
    const record = tokens[businessKey];
    if (!record || !record.refresh_token || !record.realm_id) {
      throw new Error(`QuickBooks not connected for "${businessKey}". Run: node setup-quickbooks.js ${businessKey}`);
    }

    // Refresh proactively if the access token expires within 2 minutes.
    if (record.expires_at - Date.now() > 2 * 60 * 1000) {
      return record;
    }

    const client = makeClient();
    if (!client) throw new Error('QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET not set');

    const authResponse = await client.refreshUsingToken(record.refresh_token);
    const token = authResponse.getJson();

    record.access_token = token.access_token;
    record.refresh_token = token.refresh_token;
    record.expires_at = Date.now() + token.expires_in * 1000;
    record.refresh_token_expires_at = Date.now() + token.x_refresh_token_expires_in * 1000;
    tokens[businessKey] = record;
    this._tokens = tokens;
    await this._saveTokens();
    return record;
  }

  async _apiGet(businessKey, urlPath, searchParams = {}) {
    const record = await this._ensureFreshToken(businessKey);
    const url = new URL(`${API_BASE}/v3/company/${record.realm_id}${urlPath}`);
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) url.searchParams.set(key, value);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${record.access_token}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`QuickBooks API error ${response.status}: ${body}`);
    }
    return response.json();
  }

  async getCompanyInfo(businessKey) {
    const record = await this._ensureFreshToken(businessKey);
    return this._apiGet(businessKey, `/companyinfo/${record.realm_id}`);
  }

  async getProfitAndLoss(businessKey, startDate, endDate) {
    const report = await this._apiGet(businessKey, '/reports/ProfitAndLoss', {
      start_date: startDate,
      end_date: endDate,
      accounting_method: 'Accrual',
    });
    return summarizeReportByGroup(report);
  }

  async getBalanceSheet(businessKey, asOfDate) {
    const report = await this._apiGet(businessKey, '/reports/BalanceSheet', {
      start_date: asOfDate,
      end_date: asOfDate,
      accounting_method: 'Accrual',
    });
    return summarizeReportByGroup(report);
  }
}

// QuickBooks report rows nest arbitrarily (Income > Channel sales > Square sales, ...).
// Every subtotal row carries a `group` label (Income, COGS, GrossProfit, Expenses,
// NetIncome, BankAccounts, TotalAssets, ...) on its Summary row — walk the tree once
// and flatten those labeled totals into a flat { group: amount } map.
export function summarizeReportByGroup(report) {
  const totals = {};
  const walk = (rows) => {
    for (const row of rows || []) {
      if (row.group && row.Summary?.ColData?.length) {
        const last = row.Summary.ColData[row.Summary.ColData.length - 1];
        const value = parseFloat(last?.value);
        if (!Number.isNaN(value)) totals[row.group] = value;
      }
      if (row.Rows?.Row) walk(row.Rows.Row);
    }
  };
  walk(report?.Rows?.Row);
  return totals;
}

export const quickbooksService = new QuickBooksService();
