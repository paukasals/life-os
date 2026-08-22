import Link from "next/link";
import OrderButton from "@/components/OrderButton";
import { siteConfig } from "@/lib/site-config";
import { menu } from "@/lib/menu-data";

const featured = menu[0].items;

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-sand">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              Coastal food, curbside
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              {siteConfig.tagline}
            </h1>
            <p className="mt-5 max-w-md text-sand/80">{siteConfig.description}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <OrderButton size="lg" />
              <Link
                href="/locations"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-shell/40 px-7 py-3.5 text-base font-semibold text-shell hover:border-shell"
              >
                Find the truck
              </Link>
            </div>
          </div>
          <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-teal to-teal-light/60" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-coral">
              Fan favorites
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Straight off the truck</h2>
          </div>
          <Link href="/menu" className="text-sm font-semibold text-teal hover:text-coral">
            View full menu →
          </Link>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {featured.map((item) => (
            <div key={item.name} className="rounded-2xl bg-shell p-6 shadow-sm ring-1 ring-navy/5">
              <div className="mb-4 aspect-square rounded-xl bg-sand-dark" />
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                <span className="text-sm font-semibold text-coral">{item.price}</span>
              </div>
              <p className="mt-2 text-sm text-navy/70">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sand-dark">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div className="aspect-[4/3] w-full rounded-3xl bg-gradient-to-br from-coral/30 to-teal/30" />
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-coral">
              Our story
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              A vintage Airstream, a love of fresh seafood
            </h2>
            <p className="mt-4 text-navy/70">
              Lobsteria started with a single question: why does great seafood have to mean a
              sit-down restaurant? We restored a vintage Airstream, built relationships with
              day-boat fishermen, and started serving lobster rolls, oysters, and ceviche the way
              they deserve — fast, fresh, and a little bit fun.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral"
            >
              Read our full story →
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold">Hungry yet?</h2>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Order online for pickup or delivery, or come find the Airstream at our next stop.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <OrderButton size="lg" variant="outline-dark" />
          <Link
            href="/locations"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-3.5 text-base font-semibold text-sand hover:bg-teal"
          >
            See the schedule
          </Link>
        </div>
      </section>
    </>
  );
}
