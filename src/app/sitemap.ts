import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";

/** Public pages only — everything else needs a session. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/track`, changeFrequency: "yearly", priority: 0.6 },
  ];
}
