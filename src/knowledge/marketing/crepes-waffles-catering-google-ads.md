# The Crepes & Waffles Bar — Catering Google Ads Plan
Last updated: August 30, 2026
*Two Search campaigns, separated so each line's economics can be judged independently. Build in Google Ads once the /catering and /cakes pages are live — do not launch traffic to a generic homepage.*

---

## BUDGET (validation phase, first 10–14 days)

- Campaign A (Catering): $30–35/day
- Campaign B (Cakes): $15–25/day
- Combined: ~$40–60/day → ~$1,200–1,800 for the first two weeks
- Goal of phase 1: enough conversion data to know cost-per-lead and lead→order rate, not scale

Conversion actions to set up in Google Ads (via Google Tag / GA4 import) before spending a dollar:
- `catering_quote_submitted` (form fill) — primary conversion
- `catering_call_click` (call button click, if a phone number is on the page)
- `catering_quote_page_view` — secondary/observation, not bid-optimized

---

## CAMPAIGN A — CATERING (Canapé Trays)

**Landing page:** /catering
**Campaign type:** Search, Manual CPC → switch to Maximize Conversions once ~15–20 conversions logged
**Geo:** Miami-Dade + 15–20mi radius (adjust to actual delivery radius once set)

**Ad Group 1 — Dessert Catering (broad intent)**
Keywords: dessert catering miami, dessert catering near me, catering desserts, dessert platters miami, sweet table catering miami, finger desserts catering

**Ad Group 2 — Event-specific**
Keywords: party desserts miami, corporate dessert catering, office party desserts, mini desserts catering miami, dessert catering for events

**Ad Group 3 — Format-specific (once inventory proven)**
Keywords: crepe catering miami, waffle catering miami, dessert canapes miami, mini waffles catering

**Negative keywords (all ad groups):** free, recipe, diy, wholesale, jobs, career, class, cooking class, restaurant near me

**RSA — Headlines (pick 10–12, Google mixes):**
1. Dessert Catering, Miami
2. Ready-to-Serve Dessert Trays
3. No Stations. No Waiting.
4. Crêpe & Waffle Catering
5. 24–48hr Notice
6. Pickup or Delivery
7. Office Party Desserts, Made Easy
8. Mini Dessert Trays, Miami
9. Get a Quote Same Day
10. Trays of 24, 36 or 48
11. Miami's Crêpe & Waffle Bar
12. Book Your Event Dessert

**RSA — Descriptions (pick 3–4):**
1. Crêpe cups and mini Belgian waffle discs, delivered ready to serve. No setup, no equipment.
2. Choose 2–4 flavors per tray. Order online, we deliver ready for your event.
3. Trusted Miami dessert catering — corporate events, birthdays, showers, offices.
4. Same-day quotes. 24–48h notice. Pickup or delivery across Miami.

**Sitelinks:** Get a Quote · See Flavors · How It Works · Order for Your Office

---

## CAMPAIGN B — CAKES

**Landing page:** /cakes (or a dedicated section of /catering if a separate page isn't ready — never send to homepage)

**Ad Group 1 — Generic cake intent**
Keywords: crepe cake miami, waffle cake miami, custom cake miami, unique birthday cake miami, cake delivery miami

**Ad Group 2 — Occasion**
Keywords: birthday cake miami, strawberry shortcake miami, celebration cake miami

**RSA — Headlines:**
1. Crêpe Cakes, Miami
2. Belgian Waffle Cakes
3. A Cake Nobody Else Makes
4. Custom Message + Candles
5. Order 48hrs Ahead
6. Miami's Crêpe & Waffle Bar
7. Strawberry, Tiramisù, Dulce de Leche
8. Cake Delivery, Miami

**RSA — Descriptions:**
1. Tall, layered crêpe and Belgian waffle cakes — a birthday cake nobody else makes.
2. 8 flavors. One standard size. 48h notice. Pickup or delivery in Miami.

---

## TRACKING CHECKLIST (do before turning ads on)

- [ ] GA4 property + conversion events wired to /catering and /cakes forms
- [ ] Google Ads conversion tag or GA4 import linked
- [ ] Call tracking number on the page if phone CTA is used
- [ ] UTM parameters on all ad-to-landing-page links (utm_source=google, utm_campaign=catering / cakes)
- [ ] Weekly review cadence: cost/lead, lead→quote, quote→booked order, $ in → $ catering revenue out

## WHEN TO SCALE

Scale spend only once you know: **$1 in Google Ads → $X catering revenue.** Until that ratio is known and repeatable at the current spend level, do not increase budget — extend the test window instead.
