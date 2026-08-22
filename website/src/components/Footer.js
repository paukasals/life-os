import Link from "next/link";
import { navLinks, siteConfig } from "@/lib/site-config";

export default function Footer() {
  return (
    <footer className="mt-24 bg-navy text-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <p className="font-display text-xl font-semibold">{siteConfig.name}</p>
          <p className="mt-3 text-sm text-sand/70">{siteConfig.tagline}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sand/50">
            Explore
          </p>
          <ul className="mt-3 space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-sand/80 hover:text-coral">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sand/50">
            Hours
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-sand/80">
            {siteConfig.hours.map((h) => (
              <li key={h.days} className="flex justify-between gap-4">
                <span>{h.days}</span>
                <span>{h.time}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sand/50">
            Get in touch
          </p>
          <ul className="mt-3 space-y-2 text-sm text-sand/80">
            <li>
              <a href={`tel:${siteConfig.phone}`} className="hover:text-coral">
                {siteConfig.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-coral">
                {siteConfig.email}
              </a>
            </li>
          </ul>
          <div className="mt-4 flex gap-4">
            <a href={siteConfig.social.instagram} className="text-sm text-sand/80 hover:text-coral">
              Instagram
            </a>
            <a href={siteConfig.social.tiktok} className="text-sm text-sand/80 hover:text-coral">
              TikTok
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-sand/10 px-6 py-5 text-center text-xs text-sand/50">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
