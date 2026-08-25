import Image from "next/image";
import OrderButton from "@/components/OrderButton";
import Reveal from "@/components/Reveal";
import { menu } from "@/lib/menu-data";
import { siteConfig } from "@/lib/site-config";

export const metadata = {
  title: "Menu",
  description:
    "Hand-cleaned wild-caught Maine lobster rolls, a five-preparation raw oyster bar, and Peruvian & Nikkei ceviche — the full Lobsteria menu.",
};

export default function MenuPage() {
  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral">Menu</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">What&apos;s cooking</h1>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Every roll starts with wild-caught Maine lobster, hand-cleaned in-house. Prices marked
          &quot;MP&quot; are market price — ask at the window.
        </p>
        <div className="mt-6">
          <OrderButton size="lg" />
        </div>
      </div>

      <div className="space-y-20 pb-20">
        {menu.map((section, sectionIndex) => (
          <Reveal key={section.category} as="section" className="mx-auto max-w-4xl px-6">
            <div className="overflow-hidden rounded-3xl">
              <div className="relative h-40 w-full sm:h-56">
                {section.banner && (
                  <Image
                    src={section.banner}
                    alt={section.category}
                    fill
                    sizes="(min-width: 768px) 896px, 100vw"
                    className="object-cover"
                    priority={sectionIndex === 0}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent" />
                <h2 className="absolute bottom-4 left-6 font-display text-2xl font-semibold text-shell sm:text-3xl">
                  {section.category}
                </h2>
              </div>

              <div className="divide-y divide-navy/10 bg-shell">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    className="group flex items-start gap-5 px-6 py-5 transition-colors hover:bg-sand"
                  >
                    {item.image && (
                      <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand-dark sm:block">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 items-start justify-between gap-6">
                      <div>
                        <h3 className="font-medium text-navy">{item.name}</h3>
                        {item.description && (
                          <p className="mt-1 text-sm text-navy/60">{item.description}</p>
                        )}
                      </div>
                      <span className="whitespace-nowrap font-semibold text-coral">
                        {item.price}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <p className="mx-auto max-w-4xl px-6 pb-20 text-center text-sm text-navy/50">
        {siteConfig.rating.value}★ from {siteConfig.rating.count}+ Google reviews — no paid ads,
        just word of mouth.
      </p>
    </div>
  );
}
