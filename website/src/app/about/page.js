import Image from "next/image";
import OrderButton from "@/components/OrderButton";
import Reveal from "@/components/Reveal";
import AnimatedCounter from "@/components/AnimatedCounter";
import { siteConfig } from "@/lib/site-config";
import { timeline } from "@/lib/story-data";

export const metadata = {
  title: "Our Story",
  description:
    "From La Boqueria market in Barcelona to a restored 1977 Airstream in Wynwood — the story behind Lobsteria.",
};

export default function AboutPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral">Our story</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">A standard, not just a menu</h1>
      </div>

      <Reveal className="relative mx-auto aspect-[21/9] w-full max-w-5xl overflow-hidden rounded-3xl px-0 sm:px-6">
        <Image
          src="/images/airstream-hero.jpg"
          alt="Lobsteria's restored 1977 Airstream in Wynwood, Miami"
          fill
          sizes="(min-width: 1024px) 1024px, 100vw"
          className="object-cover"
          priority
        />
      </Reveal>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="relative space-y-12 border-l-2 border-teal/20 pl-8">
          {timeline.map((step, i) => (
            <Reveal key={step.title} delay={i * 100} className="relative">
              <span className="absolute -left-[2.55rem] top-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal ring-4 ring-sand" />
              <p className="text-xs font-semibold uppercase tracking-widest text-coral">
                {step.year}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-navy">{step.title}</h2>
              <p className="mt-2 text-navy/70">{step.text}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-16 grid grid-cols-3 divide-x divide-navy/10 rounded-2xl bg-shell py-8 text-center ring-1 ring-navy/10">
          <div>
            <div className="flex items-center justify-center gap-1 font-display text-3xl font-semibold text-navy">
              <AnimatedCounter value={siteConfig.rating.value} decimals={1} />
              <span className="text-gold">★</span>
            </div>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-navy/50">Rating</p>
          </div>
          <div>
            <AnimatedCounter
              value={siteConfig.rating.count}
              suffix="+"
              className="font-display text-3xl font-semibold text-navy"
            />
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-navy/50">
              Google reviews
            </p>
          </div>
          <div>
            <p className="font-display text-3xl font-semibold text-navy">{siteConfig.founded}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-navy/50">
              Founded
            </p>
          </div>
        </Reveal>

        <div className="mt-12 text-center">
          <OrderButton size="lg" />
        </div>
      </div>
    </div>
  );
}
