export function calculateMonthlyEquivalent(
  amountMinor: number,
  interval: "week" | "month" | "year",
  intervalCount: number = 1,
): number {
  const count = intervalCount > 0 ? intervalCount : 1;
  switch (interval) {
    case "week":
      return Math.round((amountMinor * 52) / (12 * count));
    case "month":
      return Math.round(amountMinor / count);
    case "year":
      return Math.round(amountMinor / (12 * count));
    default:
      return amountMinor;
  }
}

export function calculateAnnualEquivalent(monthlyMinor: number): number {
  return monthlyMinor * 12;
}
