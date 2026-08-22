import OrderButton from "@/components/OrderButton";

export const metadata = {
  title: "Our Story",
  description: "How Lobsteria went from a restored Airstream to a coastal favorite.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <p className="text-center text-sm font-semibold uppercase tracking-widest text-coral">
        Our story
      </p>
      <h1 className="mt-2 text-center font-display text-4xl font-semibold">
        A vintage Airstream with a big appetite
      </h1>

      <div className="mt-10 aspect-[16/9] w-full rounded-3xl bg-gradient-to-br from-teal to-coral/40" />

      <div className="mt-10 space-y-6 text-navy/80">
        <p>
          Lobsteria started with a restored 1970s Airstream and a simple idea: seafood this good
          shouldn&apos;t require a reservation. We source day-boat lobster, local oysters, and the
          freshest citrus and chiles we can find, and turn them into food you can eat with your
          hands, standing in the sun.
        </p>
        <p>
          Every roll, ceviche, and oyster is built to order, right there in the truck. No freezers,
          no shortcuts — just fresh ingredients, a tight menu, and a crew that genuinely loves
          seafood.
        </p>
        <p>
          Today you&apos;ll find us rotating through markets, waterfront pop-ups, and private events
          — plus online for pickup and delivery, so you can get Lobsteria even on the days we&apos;re
          not parked nearby.
        </p>
      </div>

      <div className="mt-12 text-center">
        <OrderButton size="lg" />
      </div>
    </div>
  );
}
