import Gallery from "@/components/Gallery";
import OrderButton from "@/components/OrderButton";

export const metadata = {
  title: "Gallery",
  description: "Photos from Lobsteria's Airstream in Wynwood, Miami.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-coral">Gallery</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">The Airstream, up close</h1>
        <p className="mx-auto mt-3 max-w-lg text-navy/70">
          Wild-caught Maine lobster, hand-cleaned in-house, and the truck it all comes from.
        </p>
        <div className="mt-6">
          <OrderButton size="lg" />
        </div>
      </div>

      <div className="mt-14">
        <Gallery />
      </div>
    </div>
  );
}
