import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";

/**
 * Only publicly reachable, indexable routes belong here — everything
 * behind the auth proxy is excluded and stays crawlable-free via
 * robots.txt. Two URLs are far below the 50,000 URL / 10 MB sitemap
 * limits, so no sitemap index is needed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/login"),
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
