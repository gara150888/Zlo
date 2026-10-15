import type { Metadata } from "next";

import Providers from "@/components/layout/providers/providers";
import { JsonLd } from "@/components/seo/json-ld";
import {
  absoluteUrl,
  siteDescription,
  siteKeywords,
  siteName,
  siteTitle,
  siteUrl,
} from "@/lib/seo";

import { TooltipProvider } from "@/components/ui/tooltip"
import "../index.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s · ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: siteKeywords,
  authors: [{ name: siteName, url: absoluteUrl("/") }],
  creator: siteName,
  publisher: siteName,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: absoluteUrl("/"),
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

/** Site-level schema.org graph; safe to emit on every page. */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: siteName,
      url: absoluteUrl("/"),
      logo: absoluteUrl("/assets/logo_black.png"),
    },
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: siteName,
      description: siteDescription,
      publisher: { "@id": absoluteUrl("/#organization") },
    },
    {
      "@type": "WebApplication",
      name: siteName,
      url: absoluteUrl("/"),
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      description: siteDescription,
      featureList: [
        "Track every recurring subscription charge",
        "Normalise weekly, monthly and yearly billing into one monthly cost",
        "Renewal reminders before the next charge",
        "Spending analytics by category",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased">
        <JsonLd data={structuredData} />
        <Providers>
          <div className="flex flex-col flex-1 w-full h-svh">
            <TooltipProvider>{children}</TooltipProvider>
          </div>
        </Providers>
      </body>
    </html>
  );
}
