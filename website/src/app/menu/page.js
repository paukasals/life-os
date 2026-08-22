import OrderButton from "@/components/OrderButton";
import { menu } from "@/lib/menu-data";

export const metadata = {
  title: "Menu",
  description: "Lobster rolls, oysters, ceviche, and more — the full Lobsteria menu.",
};

export default function MenuPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral">Menu</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">What&apos;s cooking</h1>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Everything is made to order with fresh, day-boat seafood. Prices and availability may
          vary by location.
        </p>
        <div className="mt-6">
          <OrderButton size="lg" />
        </div>
      </div>

      <div className="mt-16 space-y-14">
        {menu.map((section) => (
          <div key={section.category}>
            <h2 className="font-display text-2xl font-semibold text-teal">{section.category}</h2>
            <div className="mt-6 divide-y divide-navy/10">
              {section.items.map((item) => (
                <div key={item.name} className="flex items-start justify-between gap-6 py-4">
                  <div>
                    <h3 className="font-medium text-navy">{item.name}</h3>
                    {item.description && (
                      <p className="mt-1 text-sm text-navy/60">{item.description}</p>
                    )}
                  </div>
                  <span className="whitespace-nowrap font-semibold text-coral">{item.price}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
