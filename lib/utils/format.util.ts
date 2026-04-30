export interface Locale {
  symbol: string;
  decimalComma: boolean;
}

export const DEFAULT_LOCALE: Locale = { symbol: '৳', decimalComma: false };

export function fmt(n: number, locale: Locale = DEFAULT_LOCALE): string {
  if (n >= 1000) {
    const k = (n / 1000).toFixed(1);
    return locale.symbol + (locale.decimalComma ? k.replace('.', ',') : k) + 'k';
  }
  return locale.symbol + String(Math.round(n));
}

export function fmtFull(n: number, locale: Locale = DEFAULT_LOCALE): string {
  const base = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  return locale.symbol + (locale.decimalComma ? base.replace(/,/g, '.') : base);
}
