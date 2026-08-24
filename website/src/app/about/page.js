import Image from "next/image";
import OrderButton from "@/components/OrderButton";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Our Story",
  description:
    "From La Boqueria market in Barcelona to a restored 1977 Airstream in Wynwood — the story behind Lobsteria.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-coral">
        Our story
      </p>
      <h1 className="mt-2 text-center font-display text-4xl font-semibold">
        A standard, not just a menu
      </h1>

      <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl">
        <Image
          src="/images/airstream-hero.jpg"
          alt="Lobsteria's restored 1977 Airstream in Wynwood, Miami"
          fill
          sizes="(min-width: 768px) 768px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-10 space-y-6 text-navy/80">
        <p>
          Pau Casals grew up shopping the stalls of La Boqueria market in Barcelona with his
          family — fresh fish, real seafood, no shortcuts. That was just normal. It stuck with
          him.
        </p>
        <p>
          Before Lobsteria, Pau played professional water polo for the Spanish national team,
          competing at the U.S. Open. He worked restaurant shifts on the side during his athletic
          career, then moved into property management after retiring from the sport. Then the
          pandemic took it all away.
        </p>
        <p>
          Pau looked at what Miami was calling a lobster roll and knew exactly what was wrong
          with it. He restored a 1977 Airstream and went all-in on Lobsteria: wild-caught Maine
          lobster claw and knuckle, hand-cleaned in-house — the sweetest, most tender part —
          finished to order in one of two signature styles, the Connecticut Roll (warm, brown
          butter) or the Maine Roll (cold, secret Old Bay mayo).
        </p>
        <p>
          The menu grew from there: a five-preparation raw oyster bar, Peruvian and Nikkei
          ceviche — including a leche de tigre recipe passed down by a close friend&apos;s
          grandmother in Peru, known in the kitchen as &quot;Tía Tati&apos;s&quot; recipe — and a
          sturgeon caviar add-on for nearly anything on the menu.
        </p>
        <p>
          Since opening in {siteConfig.founded}, Lobsteria has built a {siteConfig.rating.value}★
          rating across {siteConfig.rating.count}+ Google reviews without a single paid ad
          campaign. Just word of mouth, and a standard we don&apos;t compromise on.
        </p>
      </div>

      <div className="mt-12 text-center">
        <OrderButton size="lg" />
      </div>
    </div>
  );
}
