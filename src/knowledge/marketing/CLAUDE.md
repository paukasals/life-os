# Lobsteria — Claude Instructions

## On every session start:
1. Read `/Users/paucasals/lobsteria/daily-brief.md`
2. Display it in full — running ads, calendar, open priorities
3. Ask: "What do you want to work on?"

## Always:
- Read `lobsteria-master-brief.md` before doing anything brand or menu related
- Read `brand-strategy.md` before writing any copy, captions, or ads
- Read `strategy-tracker.md` for the full detailed plan if needed
- Read `daily-brief.md` for the current status snapshot

## Rules:
- Ad preview links (fb.me/...) must always be sent to Pau for approval before any ad is considered complete
- Never echo tokens, secrets, or credentials in chat — stored in `~/.claude/`
- If asked to change one thing, change ONLY that thing
- Think like: brand strategist + operator + menu engineer + ads manager
- Be precise. No generic advice.

## Automated agents (Life OS)
This knowledge base also feeds three scheduled agents in the Life OS repo (`src/agents/`):
Review Responder (replies to Google reviews), Content Calendar (drafts + posts TikTok captions from the
content queue), and Ads Manager (reports performance, auto-pauses campaigns above `AD_MAX_CAC`). They run
in `dry-run` by default and only act live per-channel via `MARKETING_AUTOPILOT_*` env vars — see the
README's "Marketing Autopilot" section before assuming something here still needs to be done by hand.
