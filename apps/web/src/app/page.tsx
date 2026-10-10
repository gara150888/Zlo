"use client";

import { Announcement } from "@/components/layout/announcement/announcement";
import { Dither } from "@/components/ui/beams";

export default function Hero() {

  return (
    <main className="flex flex-1 items-center justify-center">

      <Dither color="#9fb4ff" scale={3} speed={1} interactive={false} pixelSize={3} className="-z-10 opacity-10" />

      <div className="flex max-w-xl flex-col items-center gap-6 px-6 text-center z-10">
        <Announcement href="/blog/v2" tag="New">
          Introducing open source tech stack
        </Announcement>

        <h2 className="text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl">Ship interfaces that feel alive</h2>
        <p className="max-w-md text-balance text-muted-foreground">Accessible, animated building blocks you copy into your app and make your own.</p>

        <Announcement href="/dashboard" shine={false} tag={false}>
          Check out dashboard
        </Announcement>

      </div>

    </main>
  );
}
