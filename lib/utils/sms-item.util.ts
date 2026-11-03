import { SMS_PRESETS } from '@/lib/constants';
import type { TDraft, TSmsItem } from '@/lib/types';
import { SURE_CONFIDENCE } from '@/lib/utils/sms-parser.util';

/** Presentation helpers shared by the review cards and both accept paths. */

export function ruleLabelFor(item: TSmsItem): string {
  return SMS_PRESETS.find(p => p.id === item.ruleId)?.label ?? item.sender;
}

/**
 * What the entry's note should say. The merchant when the message named one;
 * otherwise the institution, which at least tells the user where to look.
 */
export function defaultNoteFor(item: TSmsItem): string {
  if (item.merchant) return item.merchant;
  if (item.reference) return `${ruleLabelFor(item)} · ${item.reference}`;
  return ruleLabelFor(item);
}

/** The entry this item would become if the user accepts it unedited. */
export function smsItemToDraft(item: TSmsItem): TDraft {
  return {
    date: item.date,
    amounts: item.amount === null ? [] : [item.amount],
    note: defaultNoteFor(item),
    categoryId: item.categoryId,
    source: 'sms',
    sourceRef: item.id,
  };
}

/**
 * Items we're less sure about are grouped separately rather than mixed in, so
 * a questionable parse never looks as settled as a confident one.
 */
export function isLowConfidence(item: TSmsItem): boolean {
  return item.confidence < SURE_CONFIDENCE;
}

/**
 * True when the message named a currency that isn't the one the app displays.
 * Surfaced as a warning, never acted on — there is no currency code on
 * `TLocale` to convert against, and a silent conversion would be worse than a
 * visible mismatch.
 */
export function hasCurrencyMismatch(item: TSmsItem, localeSymbol: string): boolean {
  if (!item.currency) return false;
  const symbolCodes: Record<string, string> = {
    '৳': 'BDT', Tk: 'BDT', TK: 'BDT',
    '₹': 'INR', Rs: 'INR',
    $: 'USD', '€': 'EUR', '£': 'GBP',
  };
  const expected = symbolCodes[localeSymbol] ?? symbolCodes[localeSymbol.trim()];
  if (!expected) return false;
  return item.currency !== expected;
}
