/**
 * Display formatters for values that arrive from the API or local cache.
 *
 * Every one of these guards a real crash or a wrong-looking number that shipped:
 * `Math.abs(undefined).toFixed(2)` rendered "-$NaN", a missing `createdAt`
 * rendered "Invalid Date", and a divide-by-zero percentage produced the string
 * "NaN%" which React Native then rejected as a style value.
 */

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? parseFloat(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
};

/** Signed currency, e.g. `+$45.20` / `-$12.00`. Returns `placeholder` if unusable. */
export const formatProfit = (value: unknown, placeholder = '—'): string => {
  const n = toFiniteNumber(value);
  if (n === null) return placeholder;
  return `${n >= 0 ? '+' : '-'}$${Math.abs(n).toFixed(2)}`;
};

/** Unsigned currency, e.g. `$50.00`. */
export const formatCurrency = (value: unknown, placeholder = '—'): string => {
  const n = toFiniteNumber(value);
  return n === null ? placeholder : `$${n.toFixed(2)}`;
};

/** Compact currency for headline figures, e.g. `$45.2K`. */
export const formatCompactCurrency = (value: unknown, placeholder = '—'): string => {
  const n = toFiniteNumber(value);
  if (n === null) return placeholder;
  return Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${n.toFixed(0)}`;
};

/** Percentage with one decimal, e.g. `90.4%`. */
export const formatPercent = (value: unknown, placeholder = '—'): string => {
  const n = toFiniteNumber(value);
  return n === null ? placeholder : `${n.toFixed(1)}%`;
};

/**
 * Clamped 0-100 percentage for use in a width/height style string. Never returns
 * NaN, which React Native rejects as an invalid style value.
 */
export const percentWidth = (value: unknown): `${number}%` => {
  const n = toFiniteNumber(value) ?? 0;
  return `${Math.min(Math.max(n, 0), 100)}%`;
};

/** Locale date, or `placeholder` when the timestamp is missing or unparseable. */
export const formatDate = (value: unknown, placeholder = 'Unknown date'): string => {
  if (typeof value !== 'string' && typeof value !== 'number') return placeholder;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? placeholder : date.toLocaleDateString();
};

/** True when a profit figure is a usable number and negative. */
export const isLoss = (value: unknown): boolean => {
  const n = toFiniteNumber(value);
  return n !== null && n < 0;
};
