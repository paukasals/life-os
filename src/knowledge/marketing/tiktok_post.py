#!/usr/bin/env python3
"""
Lobsteria TikTok Poster — posts a photo via Content Posting API (PULL_FROM_URL).
Images must be hosted on lobsteria.co (already verified domain).

Workflow:
  1. Upload JPEG to GoDaddy Website Builder → copy the URL
  2. Run: python3 tiktok_post.py "<lobsteria.co image URL>" "<caption>"

Example:
  python3 tiktok_post.py \
    "https://lobsteria.co/uploads/b/.../photo.jpg" \
    "Maine lobster. Brown butter. 🦞 #lobsterroll #wynwood #miami"

Posts are PRIVATE (SELF_ONLY) until TikTok production app is approved.
After approval, change privacy_level to PUBLIC_TO_EVERYONE.
"""

import json, os, sys, urllib.request, urllib.error, time

CREDS_FILE = os.path.expanduser("~/.claude/tiktok_credentials.json")

def load_creds():
    with open(CREDS_FILE) as f:
        return json.load(f)

def post_photo(image_url, caption):
    creds = load_creds()
    env = creds.get("sandbox", creds.get("production", {}))
    access_token = env.get("access_token")

    if not access_token:
        print("ERROR: No access token. Run tiktok_step1.py + tiktok_step2.py first.")
        sys.exit(1)

    # Convert CDN URL to lobsteria.co URL if needed
    if "editmysite.com" in image_url or "cdn" in image_url:
        # Extract the path and rebase to lobsteria.co
        from urllib.parse import urlparse
        path = urlparse(image_url).path
        image_url = f"https://lobsteria.co{path}"
        print(f"Rebased to: {image_url}")

    print(f"Image: {image_url}")
    print(f"Caption: {caption[:60]}...")

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type":  "application/json; charset=utf-8"
    }

    # Post via PULL_FROM_URL
    body = {
        "post_info": {
            "title":           caption[:2200],
            "privacy_level":   "SELF_ONLY",   # change to PUBLIC_TO_EVERYONE after production approval
            "disable_duet":    False,
            "disable_comment": False,
            "disable_stitch":  False,
        },
        "source_info": {
            "source":            "PULL_FROM_URL",
            "photo_cover_index": 0,
            "photo_images":      [image_url]
        },
        "media_type": "PHOTO",
        "post_mode":  "DIRECT_POST"
    }

    req = urllib.request.Request(
        "https://open.tiktokapis.com/v2/post/publish/content/init/",
        data=json.dumps(body).encode(),
        headers=headers,
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"ERROR {e.code}: {e.read().decode()}")
        sys.exit(1)

    if result.get("error", {}).get("code") != "ok":
        print(f"ERROR: {result}")
        sys.exit(1)

    publish_id = result["data"]["publish_id"]
    print(f"\nPublish ID: {publish_id}")
    print("Waiting for TikTok to process...")

    # Poll status
    for i in range(12):
        time.sleep(5)
        status_req = urllib.request.Request(
            "https://open.tiktokapis.com/v2/post/publish/status/fetch/",
            data=json.dumps({"publish_id": publish_id}).encode(),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(status_req) as resp:
            status = json.loads(resp.read())

        s = status.get("data", {}).get("status", "")
        print(f"  [{i+1}] {s}")

        if s == "PUBLISH_COMPLETE":
            print(f"\n✅ Posted successfully! (PRIVATE until production approval)")
            return publish_id
        if "FAIL" in s or "ERROR" in s:
            print(f"\n❌ Failed: {status['data'].get('fail_reason', 'unknown')}")
            sys.exit(1)

    print("\n⚠️  Timed out waiting for status — check TikTok app manually.")
    return publish_id

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print('Usage: python3 tiktok_post.py "<image_url>" "<caption>"')
        print('Example: python3 tiktok_post.py "https://lobsteria.co/uploads/b/.../photo.jpg" "Caption #lobsteria"')
        sys.exit(1)

    post_photo(sys.argv[1], sys.argv[2])
