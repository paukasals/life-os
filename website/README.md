# Lobsteria Website

A Next.js (App Router) + Tailwind CSS marketing site for Lobsteria, with online
ordering handled by **Uber Eats Webshop** — a hosted checkout that lives on
your own domain/pages instead of Uber's marketplace listing, at a much lower
fee (currently ~2.5% + $0.29/order in the US vs. standard marketplace
commission) with no separate cart/payments system for you to build or
maintain.

## 1. Set up Uber Eats Webshop (one-time, in Uber Eats Manager)

1. Log in to [Uber Eats Manager](https://merchants.ubereats.com/) with your
   restaurant account.
2. Go to the **Webshop** tab in the side navigation.
3. Review pricing/terms and click **Create your page**. Uber generates a
   hosted ordering page pre-filled with your live menu.
4. Under **Actions**, choose:
   - **Copy Link** — a direct URL to your ordering page, or
   - **Create button** — a pre-styled "Order Online" button/snippet.
5. Copy that link.

Orders placed through Webshop flow into your normal Uber Eats order stream
(POS-integrated or not), so nothing changes about how you fulfill orders.

## 2. Point this site at it

Set the link as an environment variable:

```bash
# .env.local (local dev) or in Railway's Variables tab (production)
NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL=https://www.ubereats.com/webshop/your-real-link
```

Every "Order Now" button on the site (`src/components/OrderButton.js`) and
the `/order` page read from `siteConfig.uberEatsWebshopUrl`
(`src/lib/site-config.js`), which falls back to a placeholder Uber Eats URL
until this env var is set — so the site fully works even before you've
created your Webshop page, it just won't point anywhere real yet.

The `/order` page also tries to frame the Webshop page in an `<iframe>` for a
more "inside the site" feel. Whether that renders depends on Uber's framing
policy for your account — if it's blocked, visitors still see the "Start
Your Order" button above it, which always opens the real ordering flow in a
new tab.

## 3. Replace placeholder content

Everything business-specific lives in a few files — update these with real
details, no need to touch page markup:

- `src/lib/site-config.js` — name, tagline, phone, email, address, social
  links, hours.
- `src/lib/menu-data.js` — menu sections/items/prices.
- `src/lib/locations-data.js` — weekly Airstream schedule.
- Replace the solid-color placeholder blocks (`bg-gradient-to-br`,
  `bg-sand-dark` divs) across `src/app/**/page.js` with real photos using
  `next/image`.

## 4. Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run lint   # ESLint
npm run build  # production build check
```

## 5. Deploy on Railway (as its own service, in this same repo)

This lives inside the `life-os` monorepo but deploys independently:

1. In Railway, click **New** → **GitHub Repo** and select this repo again
   (or add a second service to the existing project).
2. In the new service's **Settings**:
   - **Root Directory**: `website`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Add environment variables (Settings → Variables):
   - `NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL` (from step 1 above)
4. Deploy. Railway will detect Node.js automatically via `package.json`.
5. Once you have a real domain, update `url` in `src/lib/site-config.js` and
   point your DNS at the Railway service (Settings → Networking → Custom
   Domain).

## Contact form

`/contact` currently uses a `mailto:` form (opens the visitor's email
client — no backend required). If you'd rather have it submit silently
without opening email, swap the `<form>` in `src/app/contact/page.js` for a
service like [Formspree](https://formspree.io) or
[Resend](https://resend.com) (needs an API route + API key).
