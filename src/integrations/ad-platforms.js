// Ad platform integrations for the Ads Manager agent.
//
// Meta (Graph API) is a plain REST call and works as soon as
// META_ACCESS_TOKEN + META_AD_ACCOUNT_ID are set.
//
// Google Ads requires a developer token approved on a manager account plus
// an OAuth client — heavier to provision. The REST call below is correct
// for the GAQL search endpoint, but until GOOGLE_ADS_DEVELOPER_TOKEN etc.
// are set it simply no-ops (returns null), same convention as every other
// "not yet integrated" fetch in this codebase.

const META_API_VERSION = 'v21.0';

export function isMetaConfigured() {
  return !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID);
}

export function isGoogleAdsConfigured() {
  return !!(
    process.env.GOOGLE_ADS_DEVELOPER_TOKEN &&
    process.env.GOOGLE_ADS_CUSTOMER_ID &&
    process.env.GOOGLE_ADS_REFRESH_TOKEN &&
    process.env.GOOGLE_ADS_CLIENT_ID &&
    process.env.GOOGLE_ADS_CLIENT_SECRET
  );
}

function metaAccountPath() {
  const id = process.env.META_AD_ACCOUNT_ID;
  return id.startsWith('act_') ? id : `act_${id}`;
}

// Last 7 days of spend/reach/CPC across the whole ad account, plus
// per-campaign breakdown so the agent can reason about which to pause or
// scale.
export async function fetchMetaInsights() {
  if (!isMetaConfigured()) return null;

  const token = process.env.META_ACCESS_TOKEN;
  const fields = 'campaign_id,campaign_name,spend,reach,clicks,cpc,actions';
  const url = `https://graph.facebook.com/${META_API_VERSION}/${metaAccountPath()}/insights?level=campaign&date_preset=last_7d&fields=${fields}&access_token=${token}`;

  const resp = await fetch(url);
  const data = await resp.json();
  if (data.error) throw new Error(`Meta insights fetch failed: ${data.error.message}`);

  const campaigns = (data.data || []).map((row) => {
    const conversions = (row.actions || [])
      .filter((a) => ['purchase', 'lead', 'offsite_conversion.fb_pixel_purchase'].includes(a.action_type))
      .reduce((sum, a) => sum + Number(a.value || 0), 0);
    const spend = Number(row.spend || 0);
    return {
      campaignId: row.campaign_id,
      name: row.campaign_name,
      spend,
      reach: Number(row.reach || 0),
      clicks: Number(row.clicks || 0),
      cpc: Number(row.cpc || 0),
      conversions,
      cac: conversions > 0 ? spend / conversions : null,
    };
  });

  const totals = campaigns.reduce(
    (acc, c) => ({
      spend: acc.spend + c.spend,
      reach: acc.reach + c.reach,
      clicks: acc.clicks + c.clicks,
    }),
    { spend: 0, reach: 0, clicks: 0 }
  );

  return {
    spend: totals.spend,
    reach: totals.reach,
    engagements: totals.clicks,
    cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    campaigns,
  };
}

export async function pauseMetaCampaign(campaignId) {
  const token = process.env.META_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ status: 'PAUSED', access_token: token }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(`Meta pause failed for ${campaignId}: ${data.error.message}`);
  return data;
}

// Shifts a campaign's daily budget by a bounded percentage (positive to
// scale up, negative to cut). Guardrailed by the caller — this function just
// executes what it's told.
export async function adjustMetaCampaignBudget(campaignId, newDailyBudgetCents) {
  const token = process.env.META_ACCESS_TOKEN;
  const url = `https://graph.facebook.com/${META_API_VERSION}/${campaignId}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ daily_budget: String(Math.round(newDailyBudgetCents)), access_token: token }),
  });
  const data = await resp.json();
  if (data.error) throw new Error(`Meta budget update failed for ${campaignId}: ${data.error.message}`);
  return data;
}

async function googleAdsAccessToken() {
  const { GOOGLE_ADS_CLIENT_ID, GOOGLE_ADS_CLIENT_SECRET, GOOGLE_ADS_REFRESH_TOKEN } = process.env;
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_ADS_CLIENT_ID,
      client_secret: GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Google Ads token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// Last 7 days of spend/clicks/conversions by campaign via GAQL search.
export async function fetchGoogleAdsMetrics() {
  if (!isGoogleAdsConfigured()) return null;

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || customerId).replace(/-/g, '');
  const accessToken = await googleAdsAccessToken();

  const query = `
    SELECT campaign.id, campaign.name,
           metrics.cost_micros, metrics.clicks, metrics.conversions
    FROM campaign
    WHERE segments.date DURING LAST_7_DAYS AND campaign.status = 'ENABLED'`;

  const resp = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'login-customer-id': loginCustomerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Google Ads search failed: ${JSON.stringify(data)}`);

  const campaigns = (data.results || []).map((row) => {
    const spend = Number(row.metrics.costMicros || 0) / 1_000_000;
    const conversions = Number(row.metrics.conversions || 0);
    return {
      campaignId: row.campaign.id,
      name: row.campaign.name,
      spend,
      clicks: Number(row.metrics.clicks || 0),
      conversions,
      cac: conversions > 0 ? spend / conversions : null,
    };
  });

  const totals = campaigns.reduce(
    (acc, c) => ({ spend: acc.spend + c.spend, clicks: acc.clicks + c.clicks, conversions: acc.conversions + c.conversions }),
    { spend: 0, clicks: 0, conversions: 0 }
  );

  return {
    spend: totals.spend,
    clicks: totals.clicks,
    conversions: totals.conversions,
    cac: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
    campaigns,
  };
}

export async function pauseGoogleAdsCampaign(campaignId) {
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, '');
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || customerId).replace(/-/g, '');
  const accessToken = await googleAdsAccessToken();

  const resp = await fetch(`https://googleads.googleapis.com/v17/customers/${customerId}/campaigns:mutate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
      'login-customer-id': loginCustomerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      operations: [
        {
          update: { resourceName: `customers/${customerId}/campaigns/${campaignId}`, status: 'PAUSED' },
          updateMask: 'status',
        },
      ],
    }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`Google Ads pause failed for ${campaignId}: ${JSON.stringify(data)}`);
  return data;
}
