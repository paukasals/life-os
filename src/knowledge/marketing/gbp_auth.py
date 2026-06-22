"""
Lobsteria — Google Business Profile API Auth
Prints a URL for manual browser authorization.
"""

import json
import os
import sys
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
import requests

CREDENTIALS_FILE = "/Users/paucasals/Documents/LOBSTERIA/client_secret_289677427529-r0kj0tjifs9jdtq8sn5ga290gd4f8tf8.apps.googleusercontent.com.json"
TOKEN_FILE = "/Users/paucasals/.claude/gbp_token.json"

SCOPES = [
    "https://www.googleapis.com/auth/business.manage"
]

def get_credentials():
    creds = None
    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
            print("✅ Token refreshed.")
        else:
            flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_FILE, SCOPES)
            creds = flow.run_local_server(port=0, open_browser=True)
        with open(TOKEN_FILE, "w") as token:
            token.write(creds.to_json())
        print("✅ Token saved.")
    return creds

def get_accounts(creds):
    url = "https://mybusinessaccountmanagement.googleapis.com/v1/accounts"
    headers = {"Authorization": f"Bearer {creds.token}"}
    resp = requests.get(url, headers=headers)
    return resp.json()

def get_locations(creds, account_name):
    url = f"https://mybusinessbusinessinformation.googleapis.com/v1/{account_name}/locations?readMask=name,title,storefrontAddress"
    headers = {"Authorization": f"Bearer {creds.token}"}
    resp = requests.get(url, headers=headers)
    return resp.json()

if __name__ == "__main__":
    print("Authenticating with Google Business Profile API...")
    creds = get_credentials()
    print("\n✅ Authenticated!\n")

    print("Fetching GBP accounts...")
    accounts = get_accounts(creds)

    if "accounts" in accounts:
        for acc in accounts["accounts"]:
            print(f"\n📍 Account: {acc['name']} — {acc.get('accountName', '')}")
            locations = get_locations(creds, acc["name"])
            if "locations" in locations:
                for loc in locations["locations"]:
                    print(f"   Location: {loc['name']} — {loc.get('title', '')}")
            else:
                print(f"   Locations response: {locations}")
    else:
        print("Response:", json.dumps(accounts, indent=2))
