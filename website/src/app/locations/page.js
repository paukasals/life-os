import Image from "next/image";
import OrderButton from "@/components/OrderButton";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Visit Us",
  description: "Find Lobsteria's Airstream in Wynwood, Miami — hours, address, and directions.",
};

export default function LocationsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral">Visit us</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Find the Airstream</h1>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Lobsteria is parked in Wynwood, Miami — a restored 1977 Airstream with outdoor seating.
          Can&apos;t make it in? Order online for pickup or delivery instead.
        </p>
        <div className="mt-6">
          <OrderButton size="lg" />
        </div>
      </div>

      <Reveal className="relative mt-14 aspect-[16/9] w-full overflow-hidden rounded-3xl">
        <Image
          src="/images/ambiance-night.jpeg"
          alt="Lobsteria's Airstream and outdoor seating in Wynwood, Miami"
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
          priority
        />
      </Reveal>

      <div className="mt-14 grid gap-8 sm:grid-cols-2">
        <Reveal delay={0} className="rounded-2xl bg-shell p-6 ring-1 ring-navy/10">
          <h2 className="font-display text-lg font-semibold">Address</h2>
          <p className="mt-2 text-navy/70">
            {siteConfig.address.line1}
            <br />
            {siteConfig.address.city}, {siteConfig.address.region}
          </p>
          <p className="mt-2 text-sm text-navy/50">
            {/* TODO: add exact street address once confirmed */}
            Exact street address coming soon — follow{" "}
            <a
              href={siteConfig.social.instagram}
              className="font-semibold text-teal hover:text-coral"
            >
              @lobsteriamia
            </a>{" "}
            for the pin.
          </p>
        </Reveal>

        <Reveal delay={100} className="rounded-2xl bg-shell p-6 ring-1 ring-navy/10">
          <h2 className="font-display text-lg font-semibold">Hours</h2>
          <ul className="mt-2 space-y-1.5 text-navy/70">
            {siteConfig.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-4">
                <span>{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <p className="mt-10 text-center text-sm text-navy/60">
        Planning a wedding, corporate event, or private party? Lobsteria caters — see{" "}
        <a href="/contact" className="font-semibold text-teal hover:text-coral">
          Contact
        </a>{" "}
        for event boxes and booking.
      </p>
    </div>
  );
}
