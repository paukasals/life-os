export default function Marquee({ items }) {
  const doubled = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-shell/10 bg-navy py-4">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-10 text-sm font-semibold uppercase tracking-widest text-sand/70"
          >
            {item}
            <span className="text-coral">✶</span>
          </span>
        ))}
      </div>
    </div>
  );
}
