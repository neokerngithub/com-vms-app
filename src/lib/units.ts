// Nepalese land unit arithmetic engine. Base unit: square feet.

export const AREA_UNITS = [
  "Bigha",
  "Kattha",
  "Dhur",
  "Kanwa",
  "Ropani",
  "Aana",
  "Paisa",
  "Dam",
  "Sq. M.",
  "Sq. Ft.",
] as const;

export type AreaUnit = (typeof AREA_UNITS)[number];

/** Strict ordering used by every unit dropdown across the app. */
export const UNIT_ORDER: string[] = [...AREA_UNITS];

export const SQFT_PER_SQM = 10.76391041671;

/** Square feet per one of each unit. */
export const SQFT_PER_UNIT: Record<string, number> = {
  // Terai system: 1 Bigha = 72,900 sq ft, 1 Kattha = 3,645, 1 Dhur = 182.25, 1 Kanwa = 45.5625
  Bigha: 72900,
  Kattha: 3645,
  Dhur: 182.25,
  Kanwa: 45.5625,
  // Hilly system: 1 Ropani = 16 Aana = 64 Paisa = 256 Dam
  Ropani: 5476,
  Aana: 5476 / 16,
  Paisa: 5476 / 64,
  Dam: 5476 / 256,
  Daam: 5476 / 256,
  // Metric
  "Sq. Ft.": 1,
  "Sq. M.": SQFT_PER_SQM,
  Hectare: 107639.1041671,
};

export const UNIT_GROUPS: { label: string; units: string[] }[] = [
  { label: "Terai", units: ["Bigha", "Kattha", "Dhur", "Kanwa"] },
  { label: "Hilly", units: ["Ropani", "Aana", "Paisa", "Dam"] },
  { label: "Metric", units: ["Sq. M.", "Sq. Ft."] },
];

export function toSqFt(value: number, unit: string): number {
  return value * (SQFT_PER_UNIT[unit] ?? 1);
}

export function fromSqFt(sqft: number, unit: string): number {
  return sqft / (SQFT_PER_UNIT[unit] ?? 1);
}

export function convert(value: number, from: string, to: string): number {
  return fromSqFt(toSqFt(value, from), to);
}

/** Break a sq ft area into a composite reading, e.g. 1-2-3-1 Ropani-Aana-Paisa-Dam */
export function breakdown(sqft: number, units: string[]): { unit: string; value: number }[] {
  let rest = sqft;
  return units.map((unit, i) => {
    const per = SQFT_PER_UNIT[unit] ?? 1;
    if (i === units.length - 1) {
      const value = rest / per;
      rest = 0;
      return { unit, value };
    }
    const whole = Math.floor(rest / per);
    rest -= whole * per;
    return { unit, value: whole };
  });
}

/** Universal display rule: every calculated figure shows exactly 4 decimals. */
export function formatNumber(n: number, digits = 4): string {
  if (!Number.isFinite(n)) return (0).toFixed(digits);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}


export function formatNPR(n: number): string {
  if (!Number.isFinite(n)) return "Rs. 0.0000";
  return (
    "Rs. " +
    n.toLocaleString("en-IN", { minimumFractionDigits: 4, maximumFractionDigits: 4 })
  );
}


/** Advanced valuation calculator. */
export interface ValuationInput {
  area: number;
  areaUnit: string;
  govRate: number;
  govRateUnit: string;
  marketRate: number;
  marketRateUnit: string;
  govSharePct: number;
  marketSharePct: number;
  distressPct: number;
}

export interface ValuationResult {
  areaSqFt: number;
  govRatePerSqFt: number;
  marketRatePerSqFt: number;
  commercialValue: number;
  governmentValue: number;
  fairMarketValue: number;
  distressValue: number;
}

export function computeValuation(input: ValuationInput): ValuationResult {
  const areaSqFt = toSqFt(input.area || 0, input.areaUnit);
  const govRatePerSqFt = (input.govRate || 0) / (SQFT_PER_UNIT[input.govRateUnit] ?? 1);
  const marketRatePerSqFt =
    (input.marketRate || 0) / (SQFT_PER_UNIT[input.marketRateUnit] ?? 1);
  const commercialValue = areaSqFt * marketRatePerSqFt;
  const governmentValue = areaSqFt * govRatePerSqFt;
  const fairMarketValue =
    governmentValue * (input.govSharePct / 100) +
    commercialValue * (input.marketSharePct / 100);
  const distressValue = fairMarketValue * (input.distressPct / 100);
  return {
    areaSqFt,
    govRatePerSqFt,
    marketRatePerSqFt,
    commercialValue,
    governmentValue,
    fairMarketValue,
    distressValue,
  };
}

/* ---------- Combined ("B-K-D-K" / "R-A-P-D") land readings ---------- */

export const TERAI_COMBINED = ["Bigha", "Kattha", "Dhur", "Kanwa"];
export const HILLY_COMBINED = ["Ropani", "Aana", "Paisa", "Dam"];

export const COMBINED_TERAI_LABEL = "Bigha-Kattha-Dhur-Kanwa";
export const COMBINED_HILLY_LABEL = "Ropani-Aana-Paisa-Dam";


/** Parse "1-5-10-2" against an ordered unit list into square feet. */
export function parseCombined(input: string, units: string[]): number {
  const parts = input
    .split(/[-\s/,]+/)
    .filter((p) => p !== "")
    .map((p) => Number(p));
  return units.reduce((sum, unit, i) => {
    const v = parts[i];
    if (v == null || !Number.isFinite(v)) return sum;
    return sum + v * (SQFT_PER_UNIT[unit] ?? 1);
  }, 0);
}

/** Format square feet as a combined reading like "1-5-10-2". */
export function formatCombined(sqft: number, units: string[]): string {
  const negative = sqft < 0;
  const parts = breakdown(Math.abs(sqft), units).map((b, i) =>
    i === units.length - 1 ? formatNumber(b.value, 2) : String(b.value),
  );
  return (negative ? "-" : "") + parts.join("-");
}
