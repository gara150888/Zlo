/**
 * SEO constants shared by the root layout, robots.txt, sitemap.xml and
 * the Open Graph image generator.
 *
 * `BETTER_AUTH_URL` is the app's required public URL (validated in
 * `packages/env`), so for this single-origin deployment it doubles as
 * the canonical site origin. The localhost fallback keeps dev and
 * builds working when the variable is absent.
 *
 * This module reads `process.env` and must only be imported from
 * server code (layouts, route handlers, metadata files).
 */
const rawSiteUrl = process.env.BETTER_AUTH_URL?.trim() || "http://localhost:3000";

/** Canonical origin without a trailing slash. */
export const siteUrl = rawSiteUrl.replace(/\/+$/, "");

export const siteName = "Zlo";

export const siteTitle = `${siteName} — Know what your subscriptions really cost`;

/**
 * Meta description kept inside the recommended 51–350 character range
 * with the primary keyword phrase up front.
 */
export const siteDescription =
  "Zlo tracks every subscription you pay for, normalises weekly, monthly and yearly billing into one monthly cost, and warns you before the next renewal hits.";

export const siteKeywords = [
  "subscription manager",
  "can subscribe",
  "remote controls roku",
  "roku remote on phone",
  "how to connect a roku remote",
  "subscription manager subscribe",
  "subscription manager app",
  "google subscription manager",
  "rocket money subscription tracker",
  "best subscription manager app",
  "how many subscription",
  "subscription tracker",
  "youtube subscription manager",
  "recurring payments tracker",
  "renewal reminders",
  "subscription cost calculator",
  "monthly spending tracker",
];

/** Absolute URL for sitemap, JSON-LD and metadata entries. */
export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteUrl}/`).toString();
}
