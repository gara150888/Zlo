"use client";

import { useMemo, useState } from "react";
import { ImagePlus } from "lucide-react";

import { SearchCell } from "@/components/ui/search-cell";
import { Skeleton } from "@/components/ui/skeleton";
import {
  filterLogos,
  useLogoLibrary,
  type Logo,
} from "./logo-library";

export type LogoPickerProps = {
  onSelect: (logo: Logo) => void;
  /** Optional affordance for logos that are not in the library. */
  onCustom?: () => void;
};

export function LogoPicker({ onSelect, onCustom }: LogoPickerProps) {
  const { logos, loading, error } = useLogoLibrary();
  const [query, setQuery] = useState("");

  const filteredLogos = useMemo(
    () => filterLogos(logos, query),
    [logos, query],
  );

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div className="grid gap-3">
      <SearchCell
        value={query}
        onValueChange={setQuery}
        placeholder="Search logos..."
        expand={false}
        className="w-full"
        items={filteredLogos.map((logo) => ({
          id: logo.slug,
          label: logo.name,
          description: logo.slug,
          group: "Logos",
          keywords: logo.aliases,
          icon: <img src={logo.svg.icon} alt="" className="size-4.5" />,
        }))}
        onSelect={(item) =>
          onSelect(filteredLogos.find((logo) => logo.slug === item.id)!)
        }
      />

      {onCustom ? (
        <button
          type="button"
          onClick={onCustom}
          className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-background">
            <ImagePlus className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-foreground">
              Use your own logo
            </span>
            <span className="block truncate text-xs">
              Upload an image or paste a link
            </span>
          </span>
        </button>
      ) : null}

      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : filteredLogos.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No logos found.
          {onCustom ? " You can still add your own." : ""}
        </p>
      ) : null}
    </div>
  );
}
