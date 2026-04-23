export const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50 dark:[color-scheme:dark]";

export const CURRENCY = "MGA";
export const CURRENCY_SYMBOL = "Ar";

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${CURRENCY_SYMBOL}`;
}

export function formatCompactCurrency(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1)}B ${CURRENCY_SYMBOL}`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M ${CURRENCY_SYMBOL}`;
  }
  if (abs >= 100_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K ${CURRENCY_SYMBOL}`;
  }

  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${CURRENCY_SYMBOL}`;
}

/**
 * Compact number formatter for chart axis ticks — no currency symbol so
 * labels never wrap. Trailing ".0" is stripped for visual consistency
 * (e.g. 550M not 550.0M, but 2.2B stays 2.2B).
 */
export function formatAxisTick(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  const compact = (val: number) => {
    const s = val.toFixed(1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };

  if (abs >= 1_000_000_000) return `${sign}${compact(abs / 1_000_000_000)}B Ar`;
  if (abs >= 1_000_000)     return `${sign}${compact(abs / 1_000_000)}M Ar`;
  if (abs >= 1_000)         return `${sign}${compact(abs / 1_000)}K Ar`;
  return `${sign}${abs.toFixed(0)} Ar`;
}

/**
 * Returns ISO timestamp boundaries for the current calendar day.
 * Used by "today total" queries to avoid duplicating this logic.
 */
export function getTodayRange(): { start: string; end: string } {
  const today = new Date().toISOString().split("T")[0];
  return { start: `${today}T00:00:00`, end: `${today}T23:59:59` };
}
