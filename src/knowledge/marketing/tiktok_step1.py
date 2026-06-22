#!/usr/bin/env python3
"""Step 1: Generate auth URL. Opens browser. Saves verifier to /tmp/tt_verifier.txt"""
import json, os, urllib.parse, urllib.request, secrets, hashlib, base64, webbrowser

CREDS_FILE   = os.path.expanduser("~/.claude/tiktok_credentials.json")
REDIRECT_URI = "https://www.lobsteria.co/callback"
SCOPES       = "video.publish,video.upload,user.info.basic"

creds = json.load(open(CREDS_FILE))
client_key = creds["sandbox"]["client_key"]

code_verifier  = secrets.token_urlsafe(96)[:128]
digest         = hashlib.sha256(code_verifier.encode("ascii")).digest()
code_challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")

# Save verifier for step 2
with open("/tmp/tt_verifier.txt", "w") as f:
    f.write(code_verifier)

auth_url = "https://www.tiktok.com/v2/auth/authorize/?" + urllib.parse.urlencode({
    "client_key":            client_key,
    "scope":                 SCOPES,
    "response_type":         "code",
    "redirect_uri":          REDIRECT_URI,
    "state":                 "lobsteria123",
    "code_challenge":        code_challenge,
    "code_challenge_method": "S256",
})

print("\nOpening TikTok auth in browser...")
print("After you click Continuar, copy the FULL URL from the address bar.")
print("Then run:  python3 tiktok_step2.py '<that url>'\n")
webbrowser.open(auth_url)
