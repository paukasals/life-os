import { siteConfig } from "@/lib/site-config";

const sizeClasses = {
  md: "px-5 py-2.5 text-sm",
  lg: "px-7 py-3.5 text-base",
};

export default function OrderButton({
  size = "md",
  variant = "solid",
  label = "Order Now",
  className = "",
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide transition-colors";
  const variants = {
    solid: "bg-coral text-shell hover:bg-coral-dark",
    outline: "border-2 border-shell text-shell hover:bg-shell hover:text-navy",
    "outline-dark": "border-2 border-navy text-navy hover:bg-navy hover:text-shell",
  };

  return (
    <a
      href={siteConfig.uberEatsWebshopUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${sizeClasses[size]} ${variants[variant]} ${className}`}
    >
      {label}
      <span aria-hidden="true">→</span>
    </a>
  );
}
