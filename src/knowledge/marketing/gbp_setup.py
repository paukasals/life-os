"""
Lobsteria — GBP profile setup
Sets URL attributes, uploads photos, creates a post.
Run: python3 gbp_setup.py
"""

import json, os, sys, time, mimetypes, requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

TOKEN_FILE    = "/Users/paucasals/.claude/gbp_token.json"
ACCOUNT_ID    = "accounts/116034753039907650025"
LOCATION_ID   = "locations/597904207241812621"
LOC_FULL      = f"{ACCOUNT_ID}/{LOCATION_ID}"
LOC_SHORT     = "locations/597904207241812621"
SCOPES        = ["https://www.googleapis.com/auth/business.manage"]

PHOTO_DIR = "/Users/paucasals/Documents/LOBSTERIA/Marketing/Studio Pictures"
PHOTOS_TO_UPLOAD = [
    "Connecticut.png",
    "Connecticut 45.png",
    "Maine Lobster.png",
    "maine lobster 1.png",
    "Nikkei Ceviche Roll.png",
    "lobster caviar.png",
    "airstream lobsteria.jpg",
]

ADDITIONAL_PHOTOS = [
    "/Users/paucasals/Documents/LOBSTERIA/Marketing/Posts Ready/IMG_8107.JPG",
    "/Users/paucasals/Documents/LOBSTERIA/Marketing/Posts Ready/IMG_8103.JPG",
    "/Users/paucasals/Documents/LOBSTERIA/Marketing/Posts Ready/IMG_7760.JPG",
    "/Users/paucasals/Documents/LOBSTERIA/Marketing/Posts Ready/EB280514-E008-4621-93C7-E307170E2868.JPG",
]

# ─────────────────────────────────────────────
def get_credentials():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return creds

# ─────────────────────────────────────────────
def set_url_attributes(creds):
    print("\n=== Setting URL attributes ===")
    headers = {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}

    attrs = [
        {
            "name": "attributes/url_order_ahead",
            "valueType": "URL",
            "uriValues": [{"uri": "https://www.lobsteria.co/?location=L6XTBDWD63GDN"}]
        },
        {
            "name": "attributes/url_tiktok",
            "valueType": "URL",
            "uriValues": [{"uri": "https://www.tiktok.com/@lobsteriamia"}]
        },
    ]

    url = f"https://mybusinessbusinessinformation.googleapis.com/v1/{LOC_SHORT}/attributes?attributeMask=attributes/url_order_ahead,attributes/url_tiktok"
    body = {"attributes": attrs}
    resp = requests.patch(url, headers=headers, json=body)
    print(f"URL attributes: {resp.status_code}")
    if resp.status_code not in (200, 201):
        print(resp.text[:500])
    else:
        print("  ✅ url_order_ahead → lobsteria.co ordering")
        print("  ✅ url_tiktok → @lobsteriamia")

# ─────────────────────────────────────────────
def upload_photo(creds, path, category="FOOD_AND_DRINK"):
    headers = {"Authorization": f"Bearer {creds.token}"}
    mime = "image/jpeg" if path.lower().endswith((".jpg", ".jpeg")) else "image/png"

    with open(path, "rb") as f:
        data = f.read()

    # Step 1: start upload session
    start_url = f"https://mybusiness.googleapis.com/upload/v1/{LOC_FULL}/media:startUpload"
    resp = requests.post(start_url, headers=headers)
    if resp.status_code not in (200, 201):
        # Fallback: try direct multipart upload to v4 endpoint
        media_meta = {
            "mediaFormat": "PHOTO",
            "locationAssociation": {"category": category},
        }
        import base64
        media_meta["dataRef"] = {"resourceName": ""}
        create_url = f"https://mybusiness.googleapis.com/v4/{LOC_FULL}/media"
        r = requests.post(create_url, headers={**headers, "Content-Type": "application/json"}, json=media_meta)
        return False, f"Upload start failed ({resp.status_code})"

    data_ref = resp.json().get("resourceName", "")
    if not data_ref:
        return False, "No resourceName in upload response"

    # Step 2: upload bytes
    upload_url = f"https://mybusiness.googleapis.com/upload/v1/{data_ref}:upload?upload_type=media"
    up_resp = requests.post(upload_url, headers={**headers, "Content-Type": mime}, data=data)
    if up_resp.status_code not in (200, 201):
        return False, f"Binary upload failed ({up_resp.status_code}): {up_resp.text[:200]}"

    # Step 3: create media item
    media_url = f"https://mybusiness.googleapis.com/v4/{LOC_FULL}/media"
    media_body = {
        "mediaFormat": "PHOTO",
        "locationAssociation": {"category": category},
        "dataRef": {"resourceName": data_ref},
    }
    create_resp = requests.post(media_url, headers={**headers, "Content-Type": "application/json"}, json=media_body)
    if create_resp.status_code in (200, 201):
        return True, "OK"
    return False, f"Create media failed ({create_resp.status_code}): {create_resp.text[:200]}"

def upload_all_photos(creds):
    print("\n=== Uploading photos ===")
    ok = 0
    fail = 0

    categories = {
        "airstream lobsteria.jpg": "EXTERIOR",
        "Connecticut.png": "FOOD_AND_DRINK",
        "Connecticut 45.png": "FOOD_AND_DRINK",
        "Maine Lobster.png": "FOOD_AND_DRINK",
        "maine lobster 1.png": "FOOD_AND_DRINK",
        "Nikkei Ceviche Roll.png": "FOOD_AND_DRINK",
        "lobster caviar.png": "FOOD_AND_DRINK",
    }

    all_paths = [(os.path.join(PHOTO_DIR, f), categories.get(f, "ADDITIONAL")) for f in PHOTOS_TO_UPLOAD]
    all_paths += [(p, "ADDITIONAL") for p in ADDITIONAL_PHOTOS]

    for path, cat in all_paths:
        name = os.path.basename(path)
        if not os.path.exists(path):
            print(f"  ⚠️  Not found: {name}")
            continue
        success, msg = upload_photo(creds, path, cat)
        if success:
            print(f"  ✅ {name} [{cat}]")
            ok += 1
        else:
            print(f"  ❌ {name}: {msg}")
            fail += 1
        time.sleep(0.5)

    print(f"\nPhotos: {ok} uploaded, {fail} failed")

# ─────────────────────────────────────────────
def create_welcome_post(creds):
    print("\n=== Creating GBP post ===")
    headers = {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}

    post_url = f"https://mybusiness.googleapis.com/v4/{LOC_FULL}/localPosts"
    body = {
        "languageCode": "en",
        "summary": "Maine lobster rolls. Fresh oysters. Peruvian ceviche.\n\nHand-cleaned whole lobster — claw and knuckle only. Freshly shucked oysters. Corvina ceviche with Tía Tati's family recipe. Caviar on anything.\n\nOpen daily 5pm–2am · 144 NE 27th St, Wynwood · Free parking · Walk up.",
        "topicType": "STANDARD",
        "callToAction": {
            "actionType": "ORDER",
            "url": "https://www.lobsteria.co/?location=L6XTBDWD63GDN"
        }
    }
    resp = requests.post(post_url, headers=headers, json=body)
    if resp.status_code in (200, 201):
        print("  ✅ Post created")
    else:
        print(f"  ❌ Post failed ({resp.status_code}): {resp.text[:300]}")

# ─────────────────────────────────────────────
if __name__ == "__main__":
    creds = get_credentials()
    set_url_attributes(creds)
    upload_all_photos(creds)
    create_welcome_post(creds)
    print("\n✅ GBP setup complete.")
