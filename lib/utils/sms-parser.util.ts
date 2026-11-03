import {
  AMOUNT_TOKEN,
  BALANCE_PHRASE,
  BARE_NUMBER,
  CREDIT_VERBS,
  CURRENCY_CODES,
  DEBIT_VERBS,
  GENERIC_ACCOUNT_TAIL,
  GENERIC_MERCHANT,
  GENERIC_REFERENCE,
  GENERIC_RULE,
  GLOBAL_EXCLUDE,
  LEFT_PREFER,
  LEFT_VETO,
} from '@/lib/constants/sms-presets.constants';
import type { TSmsDirection, TSmsParseResult, TSmsRule, TSmsUserRule } from '@/lib/types';

/**
 * Turning a bank SMS into a transaction. Deliberately pure — no React, no
 * storage, no native. That buys two things: the rule editor can run it live on
 * a pasted message, and swapping the message *source* (a notification listener
 * instead of the SMS inbox, say) would not touch a line of it.
 */

/** Below this we don't even store the message — it isn't a transaction. */
export const MIN_CONFIDENCE = 0.35;

/** At or above this the item is shown normally; between the two it's "not sure". */
export const SURE_CONFIDENCE = 0.6;

/** How far left of a number we look for context that qualifies or disqualifies it. */
const LEFT_CONTEXT_CHARS = 28;

/**
 * Senders arrive in wildly different shapes for the same institution: `bKash`,
 * `16247`, `+8801...`, `880-16247`. Normalizing to bare uppercase alphanumerics
 * with the country code stripped is what lets a preset use a short anchored
 * pattern instead of an alternation of every observed spelling.
 */
export function normalizeSender(sender: string): string {
  const upper = sender.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const withoutCountry = upper.replace(/^(?:0088|880)/, '');
  return withoutCountry.replace(/^0+(?=\d)/, '') || upper;
}

/**
 * Collapse the formatting noise that varies between OEM SMS stacks — non-breaking
 * spaces, zero-width joiners, doubled whitespace — so the patterns only ever see
 * single spaces.
 */
export function normalizeBody(body: string): string {
  return body
    .replace(/[   ]/g, ' ')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * `1,234.56` and `1.234,56` and `1234` all appear in the wild, and the app's
 * own `decimalComma` preference says nothing about what a bank wrote. So decide
 * by structure: a trailing comma group of exactly two digits with no dot
 * anywhere is a decimal comma; everything else treats commas as thousands.
 */
export function parseAmountString(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const decimalComma = /^\d{1,3}(?:[.\s]?\d{3})*,\d{2}$/.test(trimmed) || /^\d+,\d{2}$/.test(trimmed);
  const normalized = decimalComma
    ? trimmed.replace(/[.\s]/g, '').replace(',', '.')
    : trimmed.replace(/,/g, '');

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * Both verb sets routinely appear in one message ("You have received Tk 500...
 * Balance... payment"). The earlier verb is the one describing this event; the
 * later one is almost always part of the trailing summary.
 */
export function detectDirection(body: string, rule: TSmsRule): TSmsDirection {
  const debit = rule.debit ?? DEBIT_VERBS;
  const credit = rule.credit ?? CREDIT_VERBS;

  const debitAt = body.search(debit);
  const creditAt = body.search(credit);

  if (debitAt === -1 && creditAt === -1) return 'unknown';
  if (creditAt === -1) return 'debit';
  if (debitAt === -1) return 'credit';
  return debitAt <= creditAt ? 'debit' : 'credit';
}

type AmountMatch = { value: number; index: number; hadCurrency: boolean; preferred: boolean };

/**
 * The failure mode here is never "found no number" — it's "found the balance,
 * the fee, or the credit limit". So collect every candidate, veto the ones whose
 * left context names something that isn't the amount, and prefer one whose left
 * context names a transaction verb.
 */
export function extractAmount(body: string, rule: TSmsRule): AmountMatch | null {
  if (rule.amount) {
    const m = rule.amount.exec(body);
    const value = m ? parseAmountString(m[1] ?? '') : null;
    return value === null ? null : { value, index: m!.index, hadCurrency: true, preferred: true };
  }

  const candidates: AmountMatch[] = [];
  // Shared module-level regex with /g — reset before use so a previous call's
  // lastIndex can't make this one skip the start of the message.
  AMOUNT_TOKEN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = AMOUNT_TOKEN.exec(body)) !== null) {
    const raw = match[1] ?? match[2];
    if (!raw) continue;

    const value = parseAmountString(raw);
    if (value === null || value <= 0) continue;

    const left = body.slice(Math.max(0, match.index - LEFT_CONTEXT_CHARS), match.index);
    if (LEFT_VETO.test(left)) continue;

    candidates.push({
      value,
      index: match.index,
      hadCurrency: match[1] !== undefined,
      preferred: LEFT_PREFER.test(left),
    });
  }

  if (candidates.length > 0) return candidates.find(c => c.preferred) ?? candidates[0];

  // Nothing carried a currency marker. Some banks write "has been debited
  // 250.00" with the currency only in the signature, or not at all — so fall
  // back to bare numbers, but ONLY where a transaction verb sits immediately to
  // the left. That constraint is doing all the work here: without it this would
  // match card digits, dates and phone numbers. The match scores lower for
  // having no currency, which lands it in the "not sure about these" group.
  BARE_NUMBER.lastIndex = 0;
  let bare: RegExpExecArray | null;
  while ((bare = BARE_NUMBER.exec(body)) !== null) {
    const value = parseAmountString(bare[0]);
    if (value === null || value <= 0) continue;

    const left = body.slice(Math.max(0, bare.index - LEFT_CONTEXT_CHARS), bare.index);
    if (!LEFT_PREFER.test(left) || LEFT_VETO.test(left)) continue;

    return { value, index: bare.index, hadCurrency: false, preferred: true };
  }

  return null;
}

export function extractCurrency(body: string): string {
  for (const { pattern, code } of CURRENCY_CODES) {
    if (pattern.test(body)) return code;
  }
  return '';
}

function capture(body: string, pattern: RegExp): string {
  const m = pattern.exec(body);
  return m?.[1]?.trim() ?? '';
}

/** User rules outrank every built-in: if you wrote one, you meant it. */
const USER_RULE_PRIORITY = 100;

/**
 * Turns a stored rule into one the parser can run. Returns `null` when any of
 * its patterns no longer compiles.
 *
 * Lives here, with the parser, rather than next to the storage that loads
 * rules — it is pure, and that purity is what lets the rule editor compile and
 * run a half-typed rule against a pasted message with no I/O at all.
 */
export function compileUserRule(rule: TSmsUserRule): TSmsRule | null {
  try {
    return {
      id: rule.id,
      label: rule.label,
      builtin: false,
      sender: new RegExp(rule.senderPattern, 'i'),
      exclude: rule.excludePattern ? new RegExp(rule.excludePattern, 'i') : undefined,
      amount: rule.amountPattern ? new RegExp(rule.amountPattern, 'i') : undefined,
      currency: rule.currency || undefined,
      priority: USER_RULE_PRIORITY + rule.sortOrder,
    };
  } catch {
    // The form validates that patterns compile before saving, so reaching here
    // means a rule from a backup or a hand-edited database. Skipping one rule
    // is the right blast radius; throwing would kill the whole scan.
    return null;
  }
}

/** Highest-priority rule whose sender matches, falling back to the generic one. */
export function pickRule(normalizedSender: string, rules: TSmsRule[]): TSmsRule {
  const matches = rules.filter(r => r.sender.test(normalizedSender));
  if (matches.length === 0) return GENERIC_RULE;
  return matches.reduce((best, r) => (r.priority > best.priority ? r : best));
}

function score(opts: {
  rule: TSmsRule;
  amount: AmountMatch | null;
  unambiguousDirection: boolean;
  reference: string;
  merchant: string;
  body: string;
}): number {
  const { rule, amount, unambiguousDirection, reference, merchant, body } = opts;
  let total = 0;

  if (rule.id !== GENERIC_RULE.id) total += rule.priority >= 90 ? 0.35 : 0.15;
  if (amount) total += amount.hadCurrency ? 0.25 : 0.1;
  total += unambiguousDirection ? 0.2 : 0.05;
  if (reference) total += 0.1;
  if (merchant) total += 0.1;

  // A chosen amount sitting right next to a balance phrase survived LEFT_VETO
  // only because the phrase fell outside the context window. Treat it as
  // suspicious rather than trusting it outright.
  if (amount) {
    const balanceAt = body.search(BALANCE_PHRASE);
    if (balanceAt !== -1 && Math.abs(balanceAt - amount.index) <= 20) total -= 0.25;
  }

  return Math.max(0, Math.min(1, total));
}

/**
 * Returns null for anything that isn't a transaction worth storing. Credits DO
 * come back — the caller queues them as `skipped` so their hash is recorded and
 * they stop being re-detected on every scan.
 */
export function parseSms(sender: string, rawBody: string, rules: TSmsRule[]): TSmsParseResult | null {
  const body = normalizeBody(rawBody);
  if (!body) return null;
  if (GLOBAL_EXCLUDE.test(body)) return null;

  const rule = pickRule(normalizeSender(sender), rules);
  if (rule.exclude?.test(body)) return null;

  const direction = detectDirection(body, rule);

  // Ordering is load-bearing. "Available balance BDT 45,000" appears inside
  // almost every genuine debit alert, so a balance phrase can only disqualify a
  // message once we already know no transaction verb matched.
  if (direction === 'unknown' && BALANCE_PHRASE.test(body)) return null;

  const debitAt = body.search(rule.debit ?? DEBIT_VERBS);
  const creditAt = body.search(rule.credit ?? CREDIT_VERBS);
  const unambiguousDirection = direction !== 'unknown' && (debitAt === -1 || creditAt === -1);

  const amount = extractAmount(body, rule);
  const reference = capture(body, rule.reference ?? GENERIC_REFERENCE);
  const merchant = capture(body, rule.merchant ?? GENERIC_MERCHANT);
  const accountTail = capture(body, rule.accountTail ?? GENERIC_ACCOUNT_TAIL);

  const result: TSmsParseResult = {
    ruleId: rule.id === GENERIC_RULE.id ? null : rule.id,
    ruleLabel: rule.label,
    direction,
    amount: amount?.value ?? null,
    currency: extractCurrency(body) || rule.currency || '',
    merchant,
    reference,
    accountTail,
    confidence: score({ rule, amount, unambiguousDirection, reference, merchant, body }),
  };

  // A credit is recorded regardless of how confident we are — its only job is to
  // be remembered so it isn't re-detected. A debit with no amount, or one we
  // barely believe in, is noise and must not reach the queue.
  if (result.direction === 'credit') return result;
  if (result.amount === null) return null;
  if (result.confidence < MIN_CONFIDENCE) return null;

  return result;
}
