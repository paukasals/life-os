import { google } from 'googleapis';

// Lobsteria's GBP account/location — not secret, just identifiers. Override
// via env if the business profile ever moves accounts.
const ACCOUNT_ID = process.env.GBP_ACCOUNT_ID || 'accounts/116034753039907650025';
const LOCATION_ID = process.env.GBP_LOCATION_ID || 'locations/597904207241812621';
const REVIEWS_URL = `https://mybusiness.googleapis.com/v4/${ACCOUNT_ID}/${LOCATION_ID}/reviews`;

function getOAuthClient() {
  const { GBP_CLIENT_ID, GBP_CLIENT_SECRET, GBP_REFRESH_TOKEN } = process.env;
  if (!GBP_CLIENT_ID || !GBP_CLIENT_SECRET || !GBP_REFRESH_TOKEN) return null;
  const client = new google.auth.OAuth2(GBP_CLIENT_ID, GBP_CLIENT_SECRET);
  client.setCredentials({ refresh_token: GBP_REFRESH_TOKEN });
  return client;
}

export function isConfigured() {
  return !!getOAuthClient();
}

async function getAccessToken() {
  const client = getOAuthClient();
  if (!client) return null;
  const { token } = await client.getAccessToken();
  return token;
}

// Returns every review that has no owner reply yet. Empty array (not an
// error) when GBP credentials aren't configured, matching the "no
// integration wired up" convention used by the other agents.
export async function fetchUnansweredReviews() {
  const token = await getAccessToken();
  if (!token) return [];

  const reviews = [];
  let url = `${REVIEWS_URL}?pageSize=50`;

  while (url) {
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const data = await resp.json();
    if (data.error) throw new Error(`GBP reviews fetch failed: ${data.error.message || JSON.stringify(data.error)}`);

    reviews.push(...(data.reviews || []));
    url = data.nextPageToken ? `${REVIEWS_URL}?pageSize=50&pageToken=${data.nextPageToken}` : null;
  }

  return reviews.filter((r) => !r.reviewReply);
}

export async function postReviewReply(reviewId, replyText) {
  const token = await getAccessToken();
  if (!token) throw new Error('GBP credentials not configured (GBP_CLIENT_ID/GBP_CLIENT_SECRET/GBP_REFRESH_TOKEN)');

  const resp = await fetch(`${REVIEWS_URL}/${reviewId}/reply`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment: replyText }),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`GBP reply failed (${resp.status}): ${JSON.stringify(data)}`);
  return data;
}
