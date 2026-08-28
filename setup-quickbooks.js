#!/usr/bin/env node
import 'dotenv/config';
import { quickbooksService } from './src/shared/quickbooks.js';
import http from 'http';
import { URL } from 'url';
import { exec } from 'child_process';

const PORT = 3000;
const CALLBACK_PATH = '/auth/quickbooks/callback';
const BASE_URL = `http://localhost:${PORT}`;

const KNOWN_BUSINESSES = ['lobsteria', 'crepeswaffles'];

async function openBrowser(url) {
  const command = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
    ? 'start'
    : 'xdg-open';

  return new Promise((resolve) => {
    exec(`${command} "${url}"`, () => resolve());
  });
}

async function setupQuickBooks() {
  const businessKey = process.argv[2];

  console.log('\n🔐 QuickBooks Online Setup\n');

  if (!businessKey) {
    console.error('❌ Missing business key.\n');
    console.log('Usage: node setup-quickbooks.js <business>');
    console.log(`  where <business> identifies which QuickBooks company to connect (e.g. ${KNOWN_BUSINESSES.join(', ')})\n`);
    console.log('Each business you track (Lobsteria, The Crepes & Waffles Bar, ...) is its own');
    console.log('QuickBooks Online company, so run this once per business.\n');
    process.exit(1);
  }

  if (!process.env.QUICKBOOKS_CLIENT_ID || !process.env.QUICKBOOKS_CLIENT_SECRET) {
    console.error('❌ QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET not set.\n');
    console.log('📋 To set up QuickBooks integration:\n');
    console.log('1. Go to the Intuit Developer Portal: https://developer.intuit.com');
    console.log('2. Create an app (or select an existing one) with the Accounting scope');
    console.log(`3. Add this redirect URI to the app: ${process.env.QUICKBOOKS_REDIRECT_URI || BASE_URL + CALLBACK_PATH}`);
    console.log('4. Copy the Client ID and Client Secret into your .env as QUICKBOOKS_CLIENT_ID / QUICKBOOKS_CLIENT_SECRET');
    console.log('5. Set QUICKBOOKS_ENVIRONMENT=sandbox (or production) in .env\n');
    process.exit(1);
  }

  console.log(`Connecting business: ${businessKey}\n`);

  try {
    const authUrl = quickbooksService.getAuthUrl(businessKey);

    const server = http.createServer(async (req, res) => {
      if (!req.url || !req.url.startsWith(CALLBACK_PATH)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }

      const url = new URL(req.url, BASE_URL);
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end(`<h1>Authentication failed</h1><p>${error}</p>`);
        console.error('❌ OAuth error:', error);
        server.close();
        process.exit(1);
        return;
      }

      if (!url.searchParams.get('code') || !url.searchParams.get('realmId')) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h1>Missing code or realmId</h1><p>QuickBooks did not return the expected callback parameters.</p>');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h1>Authentication successful</h1><p>You can close this window and return to the terminal.</p>');

      try {
        console.log('\n⏳ Exchanging code for tokens...');
        const { realmId } = await quickbooksService.saveTokenFromCallbackUrl(req.url && `${BASE_URL}${req.url}`, businessKey);
        console.log(`✅ QuickBooks authentication successful for "${businessKey}"! (realmId: ${realmId})\n`);
        console.log('📝 Token saved to .quickbooks-tokens.json. The Finance Agent will now pull real data for this business.\n');
      } catch (err) {
        console.error('❌ Setup failed:', err.message);
        process.exit(1);
      } finally {
        server.close();
      }
    });

    server.listen(PORT, async () => {
      console.log(`🌐 Waiting for QuickBooks callback at ${BASE_URL}${CALLBACK_PATH}`);
      console.log('📖 Opening QuickBooks authentication URL...\n');
      console.log('🔗 If browser does not open automatically, visit this URL:');
      console.log(authUrl);
      console.log('\n');
      await openBrowser(authUrl);
    });

    server.on('error', (err) => {
      console.error('❌ Server error:', err.message);
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

setupQuickBooks();
