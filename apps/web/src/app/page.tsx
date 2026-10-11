"use client";

import Link from "next/link";
import { ArrowRight, LayoutDashboardIcon } from "lucide-react";

import { Announcement } from "@/components/layout/announcement/announcement";
import { Button } from "@/components/ui/button";
import { Dither } from "@/components/ui/beams";
import { useTheme } from "next-themes";

export default function Hero() {
  const { resolvedTheme } = useTheme();

  const logo = resolvedTheme === "dark" ? "/assets/logo_white.png" : "/assets/logo_black.png";

  return (
    <main className="flex flex-1 items-center justify-center">
      <Dither color="#9fb4ff" scale={3} speed={1} interactive={false} pixelSize={3} className="-z-10 opacity-10" />

      <div className="flex max-w-xl flex-col items-center gap-6 px-6 text-center z-10">

        <img data-no-hover data-no-focus-ring suppressHydrationWarning={true} src={logo} alt="Zlo logo" className="size-20 sm:size-24" />

        <Announcement href="/dashboard" tag="New" className="hidden md:flex">
          Renewal reminders and spending analytics
        </Announcement>

        <h1 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">
          Know what your subscriptions really cost
        </h1>

        <p className="max-w-md text-balance text-muted-foreground">
          Zlo tracks every recurring charge, normalises weekly, monthly and yearly billing into one
          monthly cost, and warns you before the next renewal hits.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
            Get started
            <ArrowRight aria-hidden data-icon="inline-end" />
          </Button>
          <Button
            size="lg"
            variant="ghost"
            nativeButton={false}
            render={<Link href="/dashboard" />}
          >
            <LayoutDashboardIcon aria-hidden data-icon="inline-start" />
            Open dashboard
          </Button>
        </div>
      </div>
    </main>
  );
}
