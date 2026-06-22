#!/usr/bin/env python3
"""
Lobsteria TikTok OAuth — manual flow (no local server needed).
Run this, open the printed URL in browser, authorize, then paste the full
redirect URL (from the address bar) back here.
Token saved to ~/.claude/tiktok_credentials.json
"""

import json, os, sys, urllib.parse, urllib.request
import secrets, hashlib, base64

CREDS_FILE    = os.path.expanduser("~/.claude/tiktok_credentials.json")
REDIRECT_URI  = "https://www.lobsteria.co/callback"
SCOPES        = "video.publish,user.info.basic"

with open(CREDS_FILE) as f:
    creds = json.load(f)

client_key    = creds["sandbox"]["client_key"]
client_secret = creds["sandbox"]["client_secret"]

# PKCE S256
code_verifier  = secrets.token_urlsafe(96)[:128]
digest         = hashlib.sha256(code_verifier.encode("ascii")).digest()
code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

auth_url = "https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode({
    "client_key":            client_key,
    "scope":                 SCOPES,
    "response_type":         "code",
    "redirect_uri":          REDIRECT_URI,
    "state":                 "lobsteria123",
    "code_challenge":        code_challenge,
    "code_challenge_method": "S256",
})

print("\n=== LOBSTERIA TIKTOK OAUTH ===")
print("\n1. Open this URL in your browser:\n")
print(auth_url)
print("\n2. Authorize the app (click Continuar)")
print("3. You'll land on lobsteria.co — it may show a 404, that's OK")
print("4. Copy the FULL URL from the browser address bar and paste it here:\n")

redirect_url = input("Paste redirect URL: ").strip()

# Extract code from the pasted URL
parsed = urllib.parse.parse_qs(urllib.parse.urlparse(redirect_url).query)
if "code" not in parsed:
    print(f"ERROR: No code found in URL. Got params: {parsed}")
    sys.exit(1)

code = parsed["code"][0]
print(f"\nGot code: {code[:10]}...")

# Exchange code for token
token_body = urllib.parse.urlencode({
    "client_key":    client_key,
    "client_secret": client_secret,
    "code":          code,
    "grant_type":    "authorization_code",
    "redirect_uri":  REDIRECT_URI,
    "code_verifier": code_verifier,
})

req = urllib.request.Request(
    "https://open.tiktokapis.com/v2/oauth/token/",
    data=token_body.encode("ascii"),
    headers={"Content-Type": "application/x-www-form-urlencoded"},
    method="POST"
)

try:
    with urllib.request.urlopen(req) as resp:
        token_resp = json.loads(resp.read())
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()}")
    sys.exit(1)

print(f"\nToken response: {token_resp}")

if "access_token" not in token_resp:
    sys.exit(1)

creds["sandbox"]["access_token"]  = token_resp["access_token"]
creds["sandbox"]["open_id"]       = token_resp["open_id"]
creds["sandbox"]["refresh_token"] = token_resp.get("refresh_token", "")
creds["sandbox"]["scope"]         = token_resp.get("scope", "")

with open(CREDS_FILE, "w") as f:
    json.dump(creds, f, indent=2)

print("\n✅ SUCCESS — token saved.")
print(f"   open_id: {token_resp['open_id']}")
print(f"   scope:   {token_resp.get('scope', '')}")
