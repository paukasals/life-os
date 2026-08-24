// Central place for all business info, nav links, and integration URLs.
// Edit these values to match Lobsteria's real details — everything on the
// site pulls from here so you only have to update it in one place.

export const siteConfig = {
  name: "Lobsteria",
  tagline: "Fresh lobster, oysters & ceviche from our Airstream",
  description:
    "Lobsteria is a coastal-inspired Airstream food truck serving fresh lobster rolls, oysters, and ceviche. Order online for pickup or delivery, or find us at our next location.",
  url: "https://lobsteria.com", // TODO: set to the real production domain
  phone: "+1 (555) 123-4567", // TODO
  email: "hello@lobsteria.com", // TODO
  address: {
    // Airstream trucks move around — set this to a home base / commissary
    // address, or remove and rely on the Locations page schedule instead.
    line1: "Rotating locations — see schedule",
    city: "Miami",
    region: "FL",
    postalCode: "",
    country: "US",
  },
  social: {
    instagram: "https://instagram.com/lobsteria", // TODO
    tiktok: "https://tiktok.com/@lobsteria", // TODO
    facebook: "https://facebook.com/lobsteria", // TODO
  },
  // From Uber Eats Manager → Webshop tab → Actions → Copy Link.
  // NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL (set in Railway/`.env.local`) overrides
  // this if you ever regenerate the link.
  uberEatsWebshopUrl:
    process.env.NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL ||
    "https://www.order.store/store/lobsteria/vE-vJZpjXCe-RwCXZR_Oyw",
  hours: [
    { days: "Tue – Thu", time: "11:30 AM – 8:00 PM" },
    { days: "Fri – Sat", time: "11:30 AM – 9:30 PM" },
    { days: "Sun", time: "12:00 PM – 6:00 PM" },
    { days: "Mon", time: "Closed" },
  ],
};

export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/locations", label: "Locations" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];
