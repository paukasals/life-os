# Lobsteria — JSON-LD + On-Page SEO
Last updated: June 18, 2026

---

## PART 1 — JSON-LD Structured Data
**Where to paste:** Square Dashboard → Website → Edit Site → Pages → any page → Settings (gear icon) → "Header code" (site-wide code section)
**Or:** Site Settings → Advanced → Custom Header Code

Paste the entire `<script>` block below:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "@id": "https://www.lobsteria.co/#restaurant",
  "name": "Lobsteria",
  "alternateName": "Lobsteria Miami",
  "description": "Maine and Connecticut lobster rolls, freshly shucked oysters, and Peruvian ceviche served from a vintage Airstream in Wynwood, Miami. Hand-cleaned whole lobster, freshly shucked oysters, Tía Tati family ceviche recipe. Open daily 5pm–2am.",
  "url": "https://www.lobsteria.co",
  "telephone": "+17868507848",
  "image": "https://faa4c396e538479edc73.cdn6.editmysite.com/uploads/b/faa4c396e538479edc731721c043bc446095c4309c3db44f4154c29b89da7d65/2026-05-20_15-33-20_1779305616.jpg",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "144 NE 27th St",
    "addressLocality": "Miami",
    "addressRegion": "FL",
    "postalCode": "33137",
    "addressCountry": "US"
  },
  "geo": { "@type": "GeoCoordinates", "latitude": 25.8022, "longitude": -80.1947 },
  "hasMap": "https://share.google/DlM9jsDc9pUyj9TnF",
  "openingHoursSpecification": [{ "@type": "OpeningHoursSpecification", "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"], "opens": "17:00", "closes": "02:00" }],
  "servesCuisine": ["Seafood","American","Peruvian"],
  "priceRange": "$$",
  "menu": "https://www.lobsteria.co/menu",
  "hasMenu": "https://www.lobsteria.co/menu",
  "acceptsReservations": false,
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "reviewCount": "145", "bestRating": "5" },
  "sameAs": ["https://www.instagram.com/lobsteriamia","https://www.tiktok.com/@lobsteriamia"],
  "potentialAction": { "@type": "OrderAction", "target": { "@type": "EntryPoint", "urlTemplate": "https://www.lobsteria.co/?location=L6XTBDWD63GDN", "actionPlatform": ["http://schema.org/DesktopWebPlatform","http://schema.org/MobileWebPlatform"] } }
}
</script>
```

> **Note:** This is the deployed version (~1646 chars, fits Square's 2000-char limit). Telephone and image were added back after initial validation. Fields removed to stay under limit: logo, currenciesAccepted, paymentAccepted, founder, worstRating.

> **After pasting:** Go to https://search.google.com/test/rich-results and enter https://www.lobsteria.co to confirm Google detects it. Should show "Restaurant" entity.

---

## PART 2 — On-Page SEO: Title Tags + Meta Descriptions
**Where to set:** In Square, go to each page → Edit → (click the page) → SEO tab (or gear icon → SEO)
**Format:** Title | Meta Description

---

### Homepage (`/home` or root `/`)

**Title tag:**
```
Lobsteria Miami — Lobster Rolls, Oysters & Ceviche | Wynwood
```
*(60 chars — fits perfectly)*

**Meta description:**
```
Maine & Connecticut lobster rolls, fresh oysters & ceviches from a vintage Airstream. Open daily 5pm–2am · 144 NE 27th St, Miami.
```
*(129 chars — fits Square's 130-char limit)*

---

### Menu (`/menu`)

**Title tag:**
```
Menu — Lobster Rolls, Oysters & Ceviche | Lobsteria Miami
```
*(57 chars)*

**Meta description:**
```
Connecticut and Maine lobster rolls from $30. Oysters 5 ways from $14. Tía Tati Peruvian ceviche. Caviar on anything. Open daily 5pm–2am in Wynwood, Miami.
```
*(155 chars)*

---

### About (`/about`)

**Title tag:**
```
About Lobsteria — The Story Behind the Airstream | Miami
```
*(56 chars)*

**Meta description:**
```
Built by a Barcelona chef who found nobody doing lobster rolls right in Miami. Hand-cleaned Maine lobster. Real Peruvian ceviche. Since 2019.
```
*(140 chars — trim to 130 if Square rejects: drop "Maine")*

**Square-safe version (130 chars):**
```
Barcelona chef. Hand-cleaned Maine lobster, real Peruvian ceviche, from a vintage Airstream in Wynwood Miami. Open since 2019.
```
*(126 chars)*

---

### Event Boxes (`/eventboxes`)

**Title tag:**
```
Event Boxes — Lobster Roll Catering | Lobsteria Miami
```
*(53 chars)*

**Meta description:**
```
Branded Lobsteria boxes packed with fresh lobster rolls, caviar, and sauces. Pre-order online for pickup or delivery. 18, 36, or 54 rolls. 24–48h notice.
```
*(153 chars)*

---

### Request Catering (`/request-catering`)

**Title tag:**
```
Book Catering — Lobsteria Miami | Lobster Rolls for Events
```
*(58 chars)*

**Meta description:**
```
Book Lobsteria for your event — lobster rolls, oysters, and ceviche for any group size. In-person catering or event box pre-order. Miami and South Florida.
```
*(155 chars)*

---

## PART 3 — Quick Instructions for Square

### JSON-LD (site-wide, do once):
1. Square Dashboard → **Website** → **Edit Site**
2. Click the **gear icon** (Site Settings) or find **"Custom Code"**
3. Paste the `<script>` block into **Header Code**
4. Save + Publish

### Title + Meta (per page):
1. In the site editor, click on the page name
2. Click the **gear/settings icon** on the page
3. Go to **SEO** tab
4. Paste **Page title** and **Meta description**
5. Repeat for each of the 5 pages above
6. Publish

---

## PART 4 — Validate
After publishing, check these:
- **Rich Results Test:** https://search.google.com/test/rich-results → enter https://www.lobsteria.co
- **Meta Inspector:** https://metatags.io → enter https://www.lobsteria.co
- **Search Console:** Coverage report will update within 48–72h
