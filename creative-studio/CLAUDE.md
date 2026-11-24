# Lobsteria Creative Studio — Claude Instructions

## Read first, every session
1. `STATUS.md` in this folder — current implementation state, what's built,
   verified, blocked, and pending. Don't re-audit from scratch; continue
   from the last confirmed state.
2. `src/knowledge/marketing/brand-rules.md` — mandatory, overrides
   everything else. Every agent in this pipeline must check output against
   it before anything reaches `approved/`.
3. `compliance-notes.md` in this folder — legal constraints (recording
   consent, platform API rules) that limit what the pipeline may do
   automatically.

## Rules specific to this department
- Nothing moves past `finished/` to `approved/` without Pau's explicit
  approval. No agent auto-approves or auto-publishes, ever, unless Pau
  later authorizes a specific auto-publish policy in writing.
- Never spend money, create a paid account, or install a paid tool without
  asking Pau first and getting an explicit yes.
- Never invent Lobsteria data (prices, follower counts, menu items,
  financials). Pull from `src/knowledge/marketing/` or ask.
- Reuse `src/shared/base-agent.js` and the orchestrator pattern already in
  this repo — don't build a parallel agent framework.
- This is a large, multi-phase build (see STATUS.md Phase tracker). Don't
  claim a phase is done without a real, verified test — mocks and
  demonstrations are not integrations.
