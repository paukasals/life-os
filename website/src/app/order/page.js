import OrderButton from "@/components/OrderButton";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Order Online",
  description: "Order Lobsteria for pickup or delivery.",
};

export default function OrderPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-coral">Order Online</p>
      <h1 className="mt-2 font-display text-4xl font-semibold">Get Lobsteria delivered</h1>
      <p className="mx-auto mt-3 max-w-xl text-navy/70">
        Ordering is powered by Uber Eats — pick pickup or delivery, pay securely, and track your
        order in real time. Same menu, same kitchen, just a lower fee for us than a marketplace
        order, so more of what you pay goes back into the truck.
      </p>
      <div className="mt-8">
        <OrderButton size="lg" label="Start Your Order" />
      </div>

      {/*
        Uber Eats Webshop is a hosted checkout page (menu, cart, payment, order
        tracking all live on Uber's servers) rather than a raw iframe widget —
        get your real link from Uber Eats Manager → Webshop tab → Actions →
        Copy Link, and set it as NEXT_PUBLIC_UBER_EATS_WEBSHOP_URL (see
        website/README.md). We still attempt to frame it below for a more
        "inside the site" feel; if Uber blocks embedding for your account,
        the "Start Your Order" button above always works as the fallback.
      */}
      <div className="mt-14 overflow-hidden rounded-3xl border border-navy/10 bg-shell shadow-sm">
        <iframe
          src={siteConfig.uberEatsWebshopUrl}
          title={`Order ${siteConfig.name} on Uber Eats`}
          className="h-[720px] w-full"
          loading="lazy"
        />
      </div>
      <p className="mt-4 text-xs text-navy/50">
        Menu not loading above?{" "}
        <a
          href={siteConfig.uberEatsWebshopUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-teal hover:text-coral"
        >
          Open ordering in a new tab
        </a>
        .
      </p>
    </div>
  );
}
