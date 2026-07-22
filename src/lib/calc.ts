import { CURRENCY } from "./config";

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * The core calculation of the app.
 *
 * Given how many packs you bought, how many pieces are in each pack,
 * the total price you paid, and the margin % you want, this returns:
 *  - totalUnits: total number of single pieces
 *  - costPerUnit: what one single piece cost you
 *  - sellPricePerUnit: what you should sell one piece for (after margin)
 *  - profitPerUnit / expectedProfit: how much you make
 */
export function computePricing(input: {
  packs: number;
  unitsPerPack: number;
  purchasePrice: number;
  marginPercent: number;
}) {
  const packs = Math.max(0, input.packs || 0);
  const unitsPerPack = Math.max(0, input.unitsPerPack || 0);
  const purchasePrice = Math.max(0, input.purchasePrice || 0);
  const marginPercent = input.marginPercent || 0;

  const totalUnits = packs * unitsPerPack;
  const costPerUnit = totalUnits > 0 ? purchasePrice / totalUnits : 0;
  const sellPricePerUnit = costPerUnit * (1 + marginPercent / 100);
  const profitPerUnit = sellPricePerUnit - costPerUnit;
  const expectedProfit = profitPerUnit * totalUnits;

  return {
    totalUnits,
    costPerUnit: round2(costPerUnit),
    sellPricePerUnit: round2(sellPricePerUnit),
    profitPerUnit: round2(profitPerUnit),
    expectedProfit: round2(expectedProfit),
  };
}

export function money(n: number | null | undefined): string {
  const v = typeof n === "number" && isFinite(n) ? n : 0;
  return `${v.toFixed(2)} ${CURRENCY}`;
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Whole days from today until the given date. Negative means already passed. */
export function daysUntil(d: Date | string | null | undefined): number | null {
  if (!d) return null;
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}
