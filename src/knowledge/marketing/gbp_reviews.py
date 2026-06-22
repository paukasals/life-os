"""
Lobsteria — Fetch + Respond to Google Reviews
"""

import json
import os
import time
import requests
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

TOKEN_FILE = "/Users/paucasals/.claude/gbp_token.json"
ACCOUNT_ID = "accounts/116034753039907650025"
LOCATION_ID = "locations/597904207241812621"
REVIEWS_FILE = "/Users/paucasals/lobsteria/gbp_reviews_data.json"

SCOPES = ["https://www.googleapis.com/auth/business.manage"]

def get_credentials():
    creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if creds.expired and creds.refresh_token:
        creds.refresh(Request())
        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())
    return creds

def fetch_all_reviews(creds):
    all_reviews = []
    url = f"https://mybusiness.googleapis.com/v4/{ACCOUNT_ID}/{LOCATION_ID}/reviews?pageSize=50"
    headers = {"Authorization": f"Bearer {creds.token}"}

    while url:
        resp = requests.get(url, headers=headers)
        data = resp.json()

        if "error" in data:
            print(f"Error: {data['error']}")
            return all_reviews

        reviews = data.get("reviews", [])
        all_reviews.extend(reviews)
        print(f"Fetched {len(all_reviews)} reviews so far...")

        next_token = data.get("nextPageToken")
        if next_token:
            base = f"https://mybusiness.googleapis.com/v4/{ACCOUNT_ID}/{LOCATION_ID}/reviews?pageSize=50"
            url = f"{base}&pageToken={next_token}"
        else:
            url = None

    return all_reviews

if __name__ == "__main__":
    import sys
    creds = get_credentials()

    print("Fetching all Lobsteria reviews...")
    reviews = fetch_all_reviews(creds)

    # Save to file
    with open(REVIEWS_FILE, "w") as f:
        json.dump(reviews, f, indent=2)

    print(f"\n✅ Fetched {len(reviews)} reviews — saved to gbp_reviews_data.json")

    # Summary
    no_reply = [r for r in reviews if "reviewReply" not in r]
    has_reply = [r for r in reviews if "reviewReply" in r]

    print(f"   Already replied: {len(has_reply)}")
    print(f"   Need reply:      {len(no_reply)}")

    # Show first 5 needing reply
    print("\n--- First 5 needing reply ---")
    for r in no_reply[:5]:
        name = r.get("reviewer", {}).get("displayName", "Anonymous")
        rating = r.get("starRating", "")
        comment = r.get("comment", "")[:100]
        print(f"\n⭐ {rating} | {name}")
        print(f"   \"{comment}...\"")
