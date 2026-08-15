import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";

/** Public pages only — everything else needs a session. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();

  const pages: [path: string, priority: number][] = [
    ["", 1],
    ["/services", 0.9],
    ["/associates", 0.7],
    ["/support", 0.7],
    ["/media", 0.5],
    ["/career", 0.5],
    ["/faqs", 0.6],
    ["/contact", 0.7],
    ["/track", 0.6],
  ];

  return pages.map(([path, priority]) => ({
    url: `${base}${path}`,
    changeFrequency: "monthly" as const,
    priority,
  }));
}
