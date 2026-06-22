#!/usr/bin/env python3
"""Step 2: Exchange the code for a token. Pass the full redirect URL as argument."""
import json, os, sys, urllib.parse, urllib.request

CREDS_FILE   = os.path.expanduser("~/.claude/tiktok_credentials.json")
REDIRECT_URI = "https://www.lobsteria.co/callback"
SCOPES       = "video.publish,video.upload,user.info.basic"

if len(sys.argv) < 2:
    print('Usage: python3 tiktok_step2.py \'<full redirect url>\'')
    sys.exit(1)

redirect_url = sys.argv[1]
parsed = urllib.parse.parse_qs(urllib.parse.urlparse(redirect_url).query)

if "code" not in parsed:
    print(f"ERROR: No code in URL. Got: {parsed}")
    sys.exit(1)

code = parsed["code"][0]
print(f"Code: {code[:15]}...")

# Read verifier saved by step 1
with open("/tmp/tt_verifier.txt") as f:
    code_verifier = f.read().strip()
print(f"Verifier: {code_verifier[:15]}...")

creds = json.load(open(CREDS_FILE))
client_key    = creds["sandbox"]["client_key"]
client_secret = creds["sandbox"]["client_secret"]

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

print(f"\nResponse: {token_resp}")

if "access_token" not in token_resp:
    sys.exit(1)

creds["sandbox"]["access_token"]  = token_resp["access_token"]
creds["sandbox"]["open_id"]       = token_resp["open_id"]
creds["sandbox"]["refresh_token"] = token_resp.get("refresh_token", "")
creds["sandbox"]["scope"]         = token_resp.get("scope", "")

with open(CREDS_FILE, "w") as f:
    json.dump(creds, f, indent=2)

print("\n✅ SUCCESS — token saved!")
print(f"   open_id: {token_resp['open_id']}")
print(f"   scope:   {token_resp.get('scope', '')}")
