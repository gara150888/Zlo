import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * robots.txt is crawler guidance only — it is not access control.
 * Private app routes stay behind the auth proxy regardless of these
 * directives; the list simply keeps them out of the crawl budget.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/subscriptions",
          "/renewals",
          "/analytics",
          "/settings",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
