import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/brand";

/**
 * Only the public marketing surface should be crawled. The console, the auth
 * screens and every API route are either behind a session or carry customer
 * data, so they are disallowed explicitly rather than left to chance.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/dashboard", "/book", "/orders", "/partners", "/login", "/register"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
