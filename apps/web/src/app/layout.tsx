import type { Metadata } from "next";

import Providers from "@/components/layout/providers/providers";

import { TooltipProvider } from "@/components/ui/tooltip"
import "../index.css";

export const metadata: Metadata = {
  title: "Zlo",
  description: "Zlo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning className="font-sans antialiased">
        <Providers>
          <div className="grid grid-rows-[auto_1fr] h-svh">
            <TooltipProvider>{children}</TooltipProvider>
          </div>
        </Providers>
      </body>
    </html>
  );
}
