// Central place for all business info, nav links, and integration URLs.
// Edit these values to match Lobsteria's real details — everything on the
// site pulls from here so you only have to update it in one place.

export const siteConfig = {
  name: "Lobsteria",
  tagline: "Miami's lobster roll",
  description:
    "Lobsteria is a converted 1977 Airstream in Miami's Wynwood, serving hand-cleaned wild-caught Maine lobster rolls, a five-preparation raw oyster bar, and Peruvian & Nikkei ceviche. 4.9 stars, 145+ Google reviews, zero paid ads.",
  url: "https://lobsteria.co",
  phone: "+1 (305) 555-0142", // TODO: confirm real number
  email: "hello@lobsteria.co", // TODO: confirm real inbox
  address: {
    line1: "Wynwood", // TODO: add exact street address
    city: "Miami",
    region: "FL",
    postalCode: "",
    country: "US",
  },
  social: {
    instagram: "https://instagram.com/lobsteriamia",
    tiktok: "https://tiktok.com/@lobsteriamia", // TODO: confirm handle
    facebook: "https://facebook.com/lobsteriamia", // TODO: confirm handle
  },
  // Set from Uber Eats Manager → Webshop tab → Actions → Copy Link.
  // NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL (set in Railway/`.env.local`) overrides
  // this if you ever regenerate the link.
  uberEatsWebshopUrl:
    process.env.NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL ||
    "https://www.order.store/store/lobsteria/vE-vJZpjXCe-RwCXZR_Oyw",
  hours: [
    { days: "Tue – Thu", time: "11:30 AM – 8:00 PM" }, // TODO: confirm real hours
    { days: "Fri – Sat", time: "11:30 AM – 9:30 PM" },
    { days: "Sun", time: "12:00 PM – 6:00 PM" },
    { days: "Mon", time: "Closed" },
  ],
  founded: 2019,
  rating: { value: 4.9, count: 145 },
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/gallery", label: "Gallery" },
  { href: "/locations", label: "Visit Us" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];
