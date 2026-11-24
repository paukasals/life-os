# Compliance Notes — Lobsteria Creative Studio

Research findings that constrain what this pipeline may automate. Not legal
advice — flagged items marked "verify with an attorney" should be confirmed
before relying on them commercially.

## Florida recording consent (relevant to Meta glasses POV footage)

- Florida is an **all-party consent state** (Fla. Stat. § 934.03): recording
  a private conversation requires everyone's consent. Violating it is a
  third-degree felony (up to 5 years, $5,000 fine) and the recorded party
  can sue civilly.
- The rule applies to communications where parties have a **reasonable
  expectation of privacy**. Whether a customer ordering at a walk-up
  Airstream window has that expectation is the open question — a public,
  semi-open service window is a materially different context from a private
  conversation, but this has not been confirmed with an attorney.
- Video without audio may be treated differently from audio/video with
  speech — sources disagree on exactly where that line falls.
- **Practical mitigation until this is confirmed legally:**
  - Post visible signage at the window: customers may be filmed for social
    media; by ordering they consent, or a clear opt-out method.
  - Get a verbal or written release for any video where a customer is
    identifiable AND their voice is captured, before using it commercially.
  - Default the Video Intelligence Agent's processing to **blur faces and
    strip audio** on any clip with a bystander in frame, unless a release
    exists on file. Flip this only after signage/release process is live.
- **Action item:** have an actual Florida attorney confirm the walk-up
  window / reasonable-expectation-of-privacy question before relying on
  customer-facing footage at any volume. Not done yet.

## Platform publishing APIs (Instagram, TikTok)

### Instagram (Meta Graph API)
- Publishing (images, videos, Reels, carousels) requires an **Instagram
  Professional account linked to a Facebook Page**, a **User access token**,
  and the `instagram_business_content_publish` permission.
- **Advanced Access requires app review**: Meta wants a detailed use-case
  explanation, data handling practices, and a privacy policy before granting
  it. This is a real approval process, not instant.
- Publishing rate limit: check `/{ig-user-id}/content_publishing_limit`
  directly rather than trusting a fixed number — sources disagreed on
  whether it's 50 or 100 posts/24h.
- New as of 2026: `is_ai_generated` self-disclosure parameter at publish
  time — must be set honestly if any AI-assisted step touches the final
  asset.

### TikTok (Content Posting API)
- Automated public posting uses **Direct Post** with the `video.publish`
  scope.
- **Apps that haven't passed TikTok's audit are capped**: 5 users per 24h,
  and posts are restricted to `SELF_ONLY` visibility (not actually public).
  Real automated public posting needs the app to clear TikTok's review.
- Third-party sources mention a 2-4 week audit and a 25 videos/account/day
  cap — not independently verified against TikTok's own docs, treat as
  unconfirmed.

### What this means for the pipeline
- We cannot wire up real automated publishing to either platform **until**:
  1. Pau's Instagram account is a Professional account linked to a Page
     (verify current status — may already be true).
  2. A Meta developer app is created and goes through Advanced Access
     review (needs Pau's business details, privacy policy link, and his
     approval to start the process — this is a "needs Pau" item, not
     something to do silently).
  3. Likewise a TikTok developer app needs to clear their audit before
     public Direct Post works for real.
- Until then, the realistic MVP output is: **finished, platform-formatted
  files ready for Pau (or whoever manages the accounts) to post manually**,
  not push-button publishing. Automated publishing is a Phase 5 item gated
  on those approvals, not something to fake with a "simulated publish."

Last updated: 2026-11-24.
