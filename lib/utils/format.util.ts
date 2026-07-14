import { DEFAULT_LOCALE } from '@/lib/constants';
import type { TLocale } from '@/lib/types';

export function fmt(n: number, locale: TLocale = DEFAULT_LOCALE): string {
  if (n >= 1000) {
    const k = (n / 1000).toFixed(1);
    return locale.symbol + (locale.decimalComma ? k.replace('.', ',') : k) + 'k';
  }
  return locale.symbol + String(Math.round(n));
}

export function fmtFull(n: number, locale: TLocale = DEFAULT_LOCALE): string {
  const base = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);
  return locale.symbol + (locale.decimalComma ? base.replace(/,/g, '.') : base);
}
