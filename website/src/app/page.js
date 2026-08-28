import Image from "next/image";
import Link from "next/link";
import OrderButton from "@/components/OrderButton";
import FAQSection from "@/components/FAQSection";
import Reveal from "@/components/Reveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import Marquee from "@/components/Marquee";
import { siteConfig } from "@/lib/site-config";
import { menu } from "@/lib/menu-data";
import { gallery } from "@/lib/gallery-data";

const featured = menu.flatMap((section) => section.items).filter((item) => item.featured);
const galleryTeaser = gallery.slice(1, 5);

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-navy text-sand">
        <div className="mx-auto grid max-w-6xl gap-16 px-6 pb-28 pt-20 md:grid-cols-2 md:items-center md:pb-32 md:pt-28">
          <Reveal direction="right">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-coral">
              A converted 1977 Airstream in Wynwood
            </p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] sm:text-6xl">
              {siteConfig.tagline}.
            </h1>
            <p className="mt-5 max-w-md text-sand/80">
              Not one of the best. The reference. Hand-cleaned wild-caught Maine lobster, a
              five-preparation raw oyster bar, and Peruvian &amp; Nikkei ceviche — zero paid ads,
              just word of mouth.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <OrderButton size="lg" />
              <Link
                href="/locations"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-shell/40 px-7 py-3.5 text-base font-semibold text-shell transition-colors hover:border-shell"
              >
                Find us in Wynwood
              </Link>
            </div>
          </Reveal>

          <Reveal direction="left" delay={150} className="relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
              <Image
                src="/images/airstream-hero.jpg"
                alt="Lobsteria's converted 1977 Airstream in Wynwood, Miami"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-shell px-6 py-4 shadow-xl sm:block">
              <div className="flex items-baseline gap-1 text-navy">
                <AnimatedCounter
                  value={siteConfig.rating.value}
                  decimals={1}
                  className="font-display text-3xl font-semibold"
                />
                <span className="text-gold">★</span>
              </div>
              <p className="text-xs font-medium text-navy/60">
                <AnimatedCounter value={siteConfig.rating.count} suffix="+" /> Google reviews
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <Marquee
        items={[
          "Wild-caught Maine lobster",
          "Hand-cleaned in-house",
          "No shortcuts",
          "Wynwood, Miami",
        ]}
      />

      <section className="mx-auto max-w-6xl px-6 py-20">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-coral">
              Signatures
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">Straight off the Airstream</h2>
          </div>
          <Link href="/menu" className="text-sm font-semibold text-teal hover:text-coral">
            View full menu →
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-4 lg:grid-rows-2">
          {featured.map((item, i) => (
            <Reveal
              key={item.name}
              delay={i * 100}
              className={`group overflow-hidden rounded-2xl bg-shell shadow-sm ring-1 ring-navy/5 ${
                i === 0 ? "lg:col-span-2 lg:row-span-2" : "lg:col-span-2"
              }`}
            >
              <div
                className={`relative overflow-hidden bg-sand-dark ${
                  i === 0 ? "aspect-[4/3] lg:aspect-square" : "aspect-[16/9]"
                }`}
              >
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                )}
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold">{item.name}</h3>
                  <span className="text-sm font-semibold text-coral">{item.price}</span>
                </div>
                <p className="mt-2 text-sm text-navy/70">{item.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="bg-sand-dark">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-coral">
                Gallery
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold">The Airstream, up close</h2>
            </div>
            <Link href="/gallery" className="text-sm font-semibold text-teal hover:text-coral">
              View full gallery →
            </Link>
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {galleryTeaser.map((photo, i) => (
              <Reveal
                key={photo.src}
                delay={i * 80}
                className="group relative aspect-square overflow-hidden rounded-2xl bg-shell"
              >
                <Link href="/gallery" className="relative block h-full w-full">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    sizes="(min-width: 640px) 25vw, 50vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <Reveal direction="right" className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl">
            <Image
              src="/images/ambiance-night.jpeg"
              alt="Lobsteria's Wynwood seating area at night"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal direction="left" delay={150}>
            <p className="text-sm font-semibold uppercase tracking-widest text-coral">
              Our story
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold">
              From La Boqueria to a Wynwood parking lot
            </h2>
            <p className="mt-4 text-navy/70">
              Founder Pau Casals grew up shopping the stalls of Barcelona&apos;s La Boqueria market —
              fresh seafood, no shortcuts, was just normal. After a professional water polo
              career, he restored a 1977 Airstream and went all-in on one idea: Miami&apos;s lobster
              roll shouldn&apos;t be a compromise.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral"
            >
              Read our full story →
            </Link>
          </Reveal>
        </div>
      </section>

      <Reveal as="div">
        <FAQSection />
      </Reveal>

      <Reveal className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h2 className="font-display text-3xl font-semibold">Hungry yet?</h2>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Order online for pickup or delivery, or come find the Airstream in Wynwood.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <OrderButton size="lg" variant="outline-dark" />
          <Link
            href="/locations"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-3.5 text-base font-semibold text-sand transition-colors hover:bg-teal"
          >
            Get directions
          </Link>
        </div>
      </Reveal>
    </>
  );
}
