import type { Metadata } from "next";

import "../index.css";
import Header from "@/components/header";
import Providers from "@/components/providers";

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
            {/* <Header />   */}
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
