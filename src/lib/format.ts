export const SELECT_CLASS =
  "h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/50";

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
