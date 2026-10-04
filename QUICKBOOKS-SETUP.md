# QuickBooks Online Integration Setup

This guide walks you through connecting QuickBooks Online to Life OS, enabling the Finance Agent to pull real revenue, cost, and cash position data instead of placeholder zeros.

## Prerequisites

- A QuickBooks Online account for each business you want to track
- Access to the Intuit Developer Portal
- Node.js 20+

## How it's modeled

Lobsteria and The Crepes & Waffles Bar are each their own legal entity, so each is its own separate QuickBooks Online company. Life OS stores one OAuth connection per business in `.quickbooks-tokens.json`, keyed by a business key (`lobsteria`, `crepeswaffles`). You run the setup script once per business.

## Step 1: Create an Intuit Developer App

1. Go to the [Intuit Developer Portal](https://developer.intuit.com) and sign in
2. Create a new app (or reuse an existing one) with the **Accounting** scope
3. Under the app's **Keys & OAuth** settings, add this redirect URI:
   - `http://localhost:3000/auth/quickbooks/callback`
4. Note the **Client ID** and **Client Secret** (use the Development keys for a sandbox company, Production keys once you're ready to connect real books)

## Step 2: Configure `.env`

```env
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
QUICKBOOKS_ENVIRONMENT=sandbox
QUICKBOOKS_REDIRECT_URI=http://localhost:3000/auth/quickbooks/callback
```

- **QUICKBOOKS_ENVIRONMENT**: `sandbox` while testing, `production` when connecting your real QuickBooks company
- **QUICKBOOKS_REDIRECT_URI**: must exactly match the redirect URI configured in the app

## Step 3: Authenticate Each Business

Run the setup script once per business, passing its key:

```bash
node setup-quickbooks.js lobsteria
node setup-quickbooks.js crepeswaffles
```

Each run will:
1. Generate an authentication URL
2. Open your browser (or provide a link to visit)
3. Ask you to sign in and select the QuickBooks company for that business
4. Save the resulting tokens to `.quickbooks-tokens.json`

## Step 4: Test the Integration

```bash
node index.js run finance
```

If at least one business is connected, the Finance Agent fetches month-to-date Profit & Loss and current bank balances from QuickBooks and sends a real Telegram report. If no business is connected yet, it logs and skips (same as before).

## How It Works

- The Finance Agent runs daily at **8:30 AM** (weekdays)
- For each configured business, it fetches:
  - **Profit & Loss** (month-to-date) → revenue, cost of goods sold, expenses, net income
  - **Balance Sheet** (as of today) → bank account balances (cash position)
- Numbers from all connected businesses are summed into a `combined` view, including a rough runway estimate (cash ÷ projected monthly burn)
- Access tokens auto-refresh using the stored refresh token; no manual re-auth needed unless the refresh token itself expires (QuickBooks refresh tokens are valid ~100 days of inactivity)

## Deploying to Railway

Local OAuth tokens live in `.quickbooks-tokens.json`, which isn't committed to git. To carry them to Railway:

```bash
base64 -i .quickbooks-tokens.json | tr -d '\n'
```

Set the result as `QUICKBOOKS_TOKENS_BASE64` in Railway's environment variables, along with `QUICKBOOKS_CLIENT_ID`, `QUICKBOOKS_CLIENT_SECRET`, and `QUICKBOOKS_ENVIRONMENT`. On boot, Life OS decodes `QUICKBOOKS_TOKENS_BASE64` into `.quickbooks-tokens.json` automatically (same pattern as `GOOGLE_CALENDAR_TOKEN_BASE64`).

## Troubleshooting

### "QuickBooks not connected for '<business>'"

Run `node setup-quickbooks.js <business>` for that business.

### "QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET not set"

Add them to `.env` (see Step 2).

### "QuickBooks API error 401"

The refresh token has likely expired (QuickBooks revokes it after ~100 days without use, or if revoked in the Intuit security settings). Re-run `node setup-quickbooks.js <business>`.

### Numbers look wrong

QuickBooks reports depend on your chart of accounts. The Finance Agent reads standard report totals (`Income`, `COGS`, `Expenses`, `NetIncome` from Profit & Loss; `BankAccounts` from Balance Sheet) — if your books categorize things unusually, the totals will follow whatever QuickBooks reports.

## Security Notes

- **`.quickbooks-tokens.json`**: Contains OAuth refresh tokens for each connected business. **Never commit to git.** Already in `.gitignore`.
- Life OS only requests the Accounting scope (read/write to accounting data, same as the QuickBooks UI) — it does not request access to payments or payroll.
- Rotate your Intuit app's Client Secret periodically from the Developer Portal.
