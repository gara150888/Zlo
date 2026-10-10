import { describe, expect, it } from "vitest";

import {
  currencySymbol,
  daysUntil,
  formatCompactCurrency,
  formatCurrency,
  formatRenewalLabel,
  minorUnitDigits,
} from "./format";

describe("minorUnitDigits", () => {
  it("uses each currency's own minor unit scale", () => {
    expect(minorUnitDigits("USD")).toBe(2);
    expect(minorUnitDigits("JPY")).toBe(0);
    expect(minorUnitDigits("BHD")).toBe(3);
  });
});

describe("formatCurrency", () => {
  it("formats two-decimal currencies from minor units", () => {
    const formatted = formatCurrency(499, "USD");
    expect(formatted).toContain("4.99");
  });

  it("formats zero-decimal currencies from minor units", () => {
    // 1200 JPY stays 1200 - never 12.00.
    expect(formatCurrency(1200, "JPY")).toContain("1,200");
    expect(formatCurrency(1200, "JPY")).not.toContain(".");
  });

  it("formats three-decimal currencies from minor units", () => {
    expect(formatCurrency(1234, "BHD")).toContain("1.234");
  });

  it("falls back to a readable form for unknown currency codes", () => {
    const formatted = formatCurrency(500, "ZZZ").replace(/\u00a0/g, " ");
    expect(formatted).toBe("ZZZ 5.00");
  });
});

describe("formatCompactCurrency", () => {
  it("produces a compact form shorter than the plain format", () => {
    const compact = formatCompactCurrency(1_500_000, "USD");
    const plain = formatCurrency(1_500_000, "USD");
    expect(compact.length).toBeLessThan(plain.length);
    expect(compact).toContain("15");
  });

  it("keeps one decimal for smaller amounts", () => {
    expect(formatCompactCurrency(150_000, "USD")).toContain("1.5");
  });
});

describe("currencySymbol", () => {
  it("returns a symbol for known currencies", () => {
    expect(currencySymbol("USD")).toBe("$");
  });

  it("falls back to the code for unknown currencies", () => {
    expect(currencySymbol("ZZZ")).toBe("ZZZ");
  });
});

describe("daysUntil and formatRenewalLabel", () => {
  const dateKey = (offsetDays: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  it("counts days relative to today", () => {
    expect(daysUntil(dateKey(5))).toBe(5);
    expect(daysUntil(dateKey(-3))).toBe(-3);
    expect(daysUntil(dateKey(0))).toBe(0);
  });

  it("labels near-term renewals in words", () => {
    expect(formatRenewalLabel(dateKey(0))).toBe("Today");
    expect(formatRenewalLabel(dateKey(1))).toBe("Tomorrow");
    expect(formatRenewalLabel(dateKey(7))).toBe("in 7 days");
    expect(formatRenewalLabel(dateKey(-7))).toBe("7 days ago");
  });
});
