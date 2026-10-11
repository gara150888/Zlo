"use client";

import { useEffect, useState } from "react";

import type { Logo } from "@/app/types/logo";

export type { Logo };

const LOGO_DATA_URL = "/logos/logos.json";
const DEFAULT_RESULT_LIMIT = 50;

/**
 * The library is fetched once and cached for the lifetime of the tab, so
 * the picker can be opened from several places without repeat requests.
 */
let cachedLogos: Logo[] | null = null;
let inFlightRequest: Promise<Logo[]> | null = null;

function loadLogos(): Promise<Logo[]> {
  if (cachedLogos) return Promise.resolve(cachedLogos);

  if (!inFlightRequest) {
    inFlightRequest = fetch(LOGO_DATA_URL)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Could not load the logo library.");
        }
        const data: unknown = await response.json();
        const logos = (data as { logos?: unknown })?.logos;
        if (!Array.isArray(logos)) {
          throw new Error("The logo library is malformed.");
        }
        cachedLogos = logos as Logo[];
        return cachedLogos;
      })
      .finally(() => {
        inFlightRequest = null;
      });
  }

  return inFlightRequest;
}

export function useLogoLibrary() {
  const [logos, setLogos] = useState<Logo[]>(cachedLogos ?? []);
  const [loading, setLoading] = useState(!cachedLogos);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cachedLogos) {
      setLogos(cachedLogos);
      setLoading(false);
      return;
    }

    let active = true;
    loadLogos()
      .then((data) => {
        if (!active) return;
        setLogos(data);
        setError("");
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load the logo library.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { logos, loading, error };
}

/** Matches a logo by name, slug, alias or category. */
export function filterLogos(
  logos: Logo[],
  query: string,
  limit = DEFAULT_RESULT_LIMIT,
): Logo[] {
  const term = query.trim().toLowerCase();
  if (!term) return logos.slice(0, limit);

  return logos
    .filter((logo) =>
      [
        logo.name,
        logo.slug,
        ...(logo.aliases ?? []),
        ...(logo.categories ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    )
    .slice(0, limit);
}
