import { siteConfig } from "@/lib/site-config";

export default function sitemap() {
  const routes = ["", "/menu", "/order", "/locations", "/about", "/contact"];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
