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
- **Escalated priority (2026-11-25):** Meta Nova glasses are now Pau's
  primary daily-wear capture device for @paupau.ownerdiary (always
  recording during POV content, picks up bystanders/customers
  automatically, no separate "point the camera" decision each time). This
  moves the attorney consult from "before scaling" to **worth doing soon**
  — continuous first-person recording during service is a meaningfully
  different exposure than occasional planned iPhone shoots.
- **Update 2026-11-25:** the real Video Plan PDF (see
  `video-production-spec.md`) already operationalizes sensible practice
  independent of this research: V10 "Pau at the Window" requires asking
  "Would you be OK if I film your first bite for our Instagram?" before
  filming (not just before posting), and the weekly Live has a visible
  consent sign at the window ("We may be live 🔴"). This is a good practical
  baseline; the attorney consult is still worth doing before scaling
  customer-facing content volume, but the MVP plan isn't exposed here.
- **Legal correction, 2026-11-26** (Pau, sourcing flsenate.gov — verified
  against Fla. Stat. § 540.08): these are actually two separate legal
  questions, not one, and the law is looser than the policy below on one
  of them:
  - **Right to use someone's likeness in marketing (§ 540.08):** requires
    the person's consent, but the statute does NOT require it to be
    written or on-camera — a verbal, off-camera "yes, go ahead" is legally
    valid consent. There's also a real statutory exception: a person who
    appears only as an unidentified member of the public (e.g., someone in
    the background of a queue) doesn't need individual consent at all. For
    a reel, framing tightly on whoever is actually participating resolves
    this in practice — a line of people behind them is not, by itself, a
    reason to get everyone's consent.
  - **Right to record audio of a private conversation (§ 934.03,
    all-party consent):** a separate question, and stricter — if a
    conversation has a reasonable expectation of privacy, consent is
    needed *before/during* the recording itself, not just before
    publishing.
  - **Couples/groups:** if two or more people are each giving their own
    on-camera opinion (e.g., a couple both reacting to the food), get each
    person's own yes, not just one on behalf of both.
- **Adopted operating policy, 2026-11-26** (Pau's choice, after the
  correction above — asked directly and confirmed keeping this): even
  though the law permits off-camera verbal consent, **the automated QC
  pipeline can only verify what's actually in the clip** — it has no way
  to confirm an off-camera conversation happened. So the operating rule
  stays stricter than the legal minimum on purpose: **the "yes" has to be
  recorded on camera itself** for the clip to be used. This isn't "what
  the law requires," it's "the only thing Gemini's QC step can actually
  check without a separate manual consent-logging process." If Pau later
  wants to rely on off-camera verbal consent for some content, that
  needs a different verification step outside this automated pipeline
  (e.g. Pau manually clearing a clip before it's ingested) — not
  supported today.
  - **Exception: minors.** A minor's own on-camera "yes" is not enough —
    needs a parent/guardian's on-camera yes instead (or in addition). QC
    should flag any clip with an apparent minor for manual review on this
    specific point, not just general content review.
  - **Bystanders exception carries over to the operating policy too:**
    someone merely visible in the background/queue, not singled out or
    identified, doesn't need an on-camera yes — this isn't a gap in the
    stricter policy, it's the same statutory exception applying.
  - This is a practical policy Pau is comfortable operating on now, not a
    substitute for the attorney consult above — still recommended before
    scaling volume, but no longer a hard blocker for the MVP given this
    rule is in place.

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

## Additional rules found in the Camera Course PDF (2026-11-25)

- **Minors:** never film minors without a parent's OK — stricter than the
  general "ask before filming" rule above, explicit about children
  specifically.
- **Wynwood murals:** murals are the artists' copyrighted work. Brands have
  been taken to court for using murals in commercial content. Keep murals
  out of frame, or blurred in the background only, unless Pau has the
  artist's permission. Relevant because Lobsteria's own content plan
  involves lots of neighborhood/Airstream-exterior shots — Wynwood is known
  for murals, so this will come up.
- **Music:** only platforms' own commercial libraries or royalty-free
  tracks — not just "don't use a licensed song as the backing track," but
  also don't let a song play audibly in the background of a shot (same
  mute/block risk).

Last updated: 2026-11-25.
