import type { Metadata } from "next";

import { siteName } from "@/lib/seo";

/**
 * `/login` is the only other public route; it needs its own title and
 * description so the two indexable pages never share metadata.
 */
export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${siteName} to see every upcoming renewal, normalised monthly cost and spending breakdown in one place.`,
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
