// TikTok Content Posting API — PULL_FROM_URL flow (same approach as the
// original tiktok_post.py script): the media must already be hosted at a
// public URL (e.g. lobsteria.co), TikTok pulls it from there directly.
const TIKTOK_API = 'https://open.tiktokapis.com/v2';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isConfigured() {
  return !!process.env.TIKTOK_ACCESS_TOKEN;
}

// Publishes a photo or video and polls until TikTok finishes processing it.
// privacyLevel defaults to SELF_ONLY (private) — matching the sandbox app's
// current approval status. Switch to PUBLIC_TO_EVERYONE once the TikTok
// production app is approved (TIKTOK_PRIVACY_LEVEL env override).
export async function postContent({ mediaUrl, caption, mediaType = 'PHOTO' }) {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) throw new Error('TikTok credentials not configured (TIKTOK_ACCESS_TOKEN missing)');
  if (!mediaUrl) throw new Error('postContent requires a public mediaUrl');

  const privacyLevel = process.env.TIKTOK_PRIVACY_LEVEL || 'SELF_ONLY';
  const postInfo = {
    title: (caption || '').slice(0, 2200),
    privacy_level: privacyLevel,
    disable_duet: false,
    disable_comment: false,
    disable_stitch: false,
  };

  const body = mediaType === 'VIDEO'
    ? {
        post_info: postInfo,
        source_info: { source: 'PULL_FROM_URL', video_url: mediaUrl },
        media_type: 'VIDEO',
        post_mode: 'DIRECT_POST',
      }
    : {
        post_info: postInfo,
        source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: [mediaUrl] },
        media_type: 'PHOTO',
        post_mode: 'DIRECT_POST',
      };

  const initResp = await fetch(`${TIKTOK_API}/post/publish/content/init/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  });
  const initData = await initResp.json();
  if (initData?.error?.code && initData.error.code !== 'ok') {
    throw new Error(`TikTok publish init failed: ${JSON.stringify(initData.error)}`);
  }

  const publishId = initData?.data?.publish_id;
  if (!publishId) throw new Error(`TikTok publish init returned no publish_id: ${JSON.stringify(initData)}`);

  for (let attempt = 0; attempt < 12; attempt++) {
    await sleep(5000);
    const statusResp = await fetch(`${TIKTOK_API}/post/publish/status/fetch/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ publish_id: publishId }),
    });
    const statusData = await statusResp.json();
    const status = statusData?.data?.status;

    if (status === 'PUBLISH_COMPLETE') return { publishId, status, privacyLevel };
    if (status && /FAIL|ERROR/.test(status)) {
      throw new Error(`TikTok publish failed: ${statusData?.data?.fail_reason || status}`);
    }
  }

  return { publishId, status: 'TIMED_OUT', privacyLevel };
}
