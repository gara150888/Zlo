
"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  ChevronRight,
  CloudRain,
  MousePointer2,
  EyeOff,
  Maximize,
  MapPinPlus,
  MailOpen,
  Bell,
  Printer,
  Settings,
  Coffee,
  Diamond,
  Copy,
  Check,
  User,
} from "lucide-react";

export default function Hero() {
  const [icon, setIcon] = useState("copy-01");
  const [copied, setCopied] = useState(false);
  const [moving, setMoving] = useState(false);

  const command = `npx shadcn add @hugeicons-animated/${icon}`;

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="min-h-full flex flex-col">

      <header className="sticky top-0 z-40 border-b border-transparent bg-background/0 transition-colors duration-200">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <a href="#top" className="group flex min-h-10 min-w-0 w-fit items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#4C7A22]">
            <span className="grid bg-primary text-background size-8 shrink-0 place-items-center rounded-[9px] border">
              <User />
            </span>
            <span className="whitespace-nowrap text-[17px] font-bold leading-none tracking-tight">
              hugeicons{" "}
              <span className="text-[#9DA19B]">animated</span>
            </span>
          </a>

          {/* Navigation Links */}
          <div className="flex shrink-0 items-center gap-2">
            <a href="/docs" className="flex min-h-10 items-center rounded-lg px-2 text-sm font-bold text-[#696D6E] transition-[background-color,color,scale] duration-150 hover:bg-[#F7F7F5] hover:text-[#141812] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C7A22] sm:px-3">
              Docs
            </a>

            <a href="https://github.com/enesgules/hugeicons-animated" target="_blank" rel="noopener noreferrer" aria-label="View hugeicons-animated on GitHub" className="flex size-10 items-center justify-center gap-2 rounded-lg bg-white text-sm font-bold text-[#141812] shadow-[0_0_0_1px_rgba(20,24,18,0.1),0_1px_2px_rgba(20,24,18,0.08)] transition-[background-color,box-shadow,scale] duration-150 hover:bg-[#F7F7F5] hover:shadow-[0_0_0_1px_rgba(20,24,18,0.14),0_2px_4px_rgba(20,24,18,0.08)] active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4C7A22] sm:w-auto sm:px-3.5" >
              <div className="pointer-events-none shrink-0 [&_path]:stroke-[1.65]" aria-hidden="true">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  overflow="visible"
                >
                  <g>
                    <path
                      d="M10 20.5675C8.28572 21.1462 6.71429 21.1462 5.35715 20.5556C4.00001 19.965 2.85715 18.7838 2 17"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M10 22V18.7579C10 18.1596 10.1839 17.6396 10.4804 17.1699C10.6838 16.8476 10.5445 16.3904 10.1771 16.2894C7.13394 15.4528 5 14.1077 5 9.64606C5 8.48611 5.38005 7.39556 6.04811 6.4464C6.21437 6.21018 6.29749 6.09208 6.31748 5.9851C6.33746 5.87813 6.30272 5.73852 6.23322 5.45932C5.95038 4.32292 5.96871 3.11619 6.39322 2.02823C6.39322 2.02823 7.27042 1.74242 9.26698 2.98969C9.72282 3.27447 9.95075 3.41686 10.1515 3.44871C10.3522 3.48056 10.6206 3.41384 11.1573 3.28041C11.8913 3.09795 12.6476 3 13.5 3C14.3524 3 15.1087 3.09795 15.8427 3.28041C16.3794 3.41384 16.6478 3.48056 16.8485 3.44871C17.0493 3.41686 17.2772 3.27447 17.733 2.98969C19.7296 1.74242 20.6068 2.02823 20.6068 2.02823C21.0313 3.11619 21.0496 4.32292 20.7668 5.45932C20.6973 5.73852 20.6625 5.87813 20.6825 5.9851C20.7025 6.09207 20.7856 6.21019 20.9519 6.4464C21.6199 7.39556 22 8.48611 22 9.64606C22 14.1077 19.8661 15.4528 16.8229 16.2894C16.4555 16.3904 16.3162 16.8476 16.5196 17.1699C16.8161 17.6396 17 18.1596 17 18.7579V22"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </g>
                </svg>
              </div>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </nav>
      </header>

      <section id="top" className={`hero-random-hero relative overflow-hidden pt-12 pb-20 sm:pt-20 lg:pb-14 ${moving ? "hero-is-moving" : ""}`}>

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
          <h1 className="relative z-10 w-fit text-balance text-[clamp(2.6rem,7.5vw,4.25rem)] font-bold leading-[1.06] tracking-[-0.03em]">
            Beautiful <span className="whitespace-nowrap">React icons.</span>
            <br />
            <span className="text-[#BFC2BD]">
              Now they{" "}
              <button type="button" onClick={() => setMoving((value) => !value)} className="hero-move-trigger">
                {moving ? "stop" : "move"}
              </button>
              .
            </span>
          </h1>

          <p className="relative z-10 mt-6 max-w-md text-pretty text-lg font-medium leading-[1.6] text-muted-foreground">
            Icons from{" "}
            <a href="https://hugeicons.com" target="_blank" rel="noopener noreferrer" className="rounded-sm text-primary underline decoration-primary decoration-2 underline-offset-4 hover:underline">
              Hugeicons
            </a>, animated by hand for React. Install each one as source code you own. No package or lock-in.
          </p>

        </div>
      </section>

    </div>
  );
}
