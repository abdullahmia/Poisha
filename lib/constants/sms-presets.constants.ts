import type { TSmsRule } from '@/lib/types';

/**
 * Built-in matching rules, deliberately in code rather than seeded into SQLite.
 *
 * These are parser logic, and parser logic has to be fixable without a new
 * install: adding the native SMS module changes the EAS fingerprint, so a
 * build that ships a schema change cannot reach existing users over the air.
 * Keeping presets here means a bank changing its SMS wording is an `eas update`
 * away. Rows in `sms_rules` are user-authored rules only.
 */

// ---------------------------------------------------------------------------
// Shared patterns — the fallbacks every rule inherits when it doesn't override.
// ---------------------------------------------------------------------------

/**
 * Messages that are never a transaction, checked before a rule is even picked.
 *
 * Failed/declined/reversed live here on purpose: a reversal is a credit, credits
 * are not entries, and silently subtracting from a past entry is not something
 * a review queue should ever do.
 */
export const GLOBAL_EXCLUDE = new RegExp(
  [
    '\\bOTP\\b',
    'one[- ]?time\\s*password',
    'verification\\s+code',
    'security\\s+code',
    'do\\s+not\\s+share',
    'never\\s+share',
    'do\\s+not\\s+disclose',
    // A PIN *change* notice is still not a transaction, but "PIN" alone appears
    // in plenty of legitimate alerts, so only the advisory sense is excluded.
    '\\byour\\s+PIN\\b',
    '\\boffer\\b',
    '\\bdiscount\\b',
    'cashback\\s+up\\s+to',
    'congratulations',
    '\\bwin\\b',
    'recharge\\s+now',
    'bit\\.ly',
    'https?://',
    'has\\s+(?:been\\s+)?(?:failed|declined)',
    '\\bunsuccessful\\b',
    '\\breversed\\b',
    'request\\s+(?:is\\s+)?(?:pending|received)',
  ].join('|'),
  'i'
);

export const DEBIT_VERBS =
  /\b(debited|debit|paid|payment|purchase|spent|withdrawn|withdrawal|cash\s?out|send\s?money|sent|transferred\s+to|used\s+for|charged|deducted|bill\s?pay)\b/i;

export const CREDIT_VERBS =
  /\b(credited|credit|received|deposit|deposited|cash\s?in|add\s?money|refund|salary|disburse)\b/i;

/**
 * A balance phrase alone does not disqualify a message — "Available balance BDT
 * 45,000" is part of almost every legitimate debit alert. This is only consulted
 * once direction detection has already come back `unknown`.
 */
export const BALANCE_PHRASE = /\b(bal(?:ance)?|avl\s*bal|available\s+balance)\b/i;

/**
 * Every currency-adjacent number in the message, in either order. `\s*` not
 * `\s+` after the symbol — Rocket sends `Tk450.00` with no space at all.
 *
 * The number accepts both separators interchangeably (`2,345.67` and
 * `1.234,56`) and leaves disambiguation to `parseAmountString`. It must end in
 * a digit, which is what stops it swallowing the full stop ending a sentence.
 */
export const AMOUNT_TOKEN =
  /(?:BDT|TK|Tk\.?|৳|USD|US\$|\$|INR|Rs\.?|₹|EUR|€)\s*([0-9][0-9.,]*[0-9]|[0-9])|([0-9][0-9.,]*[0-9]|[0-9])\s*(?:BDT|TK|Tk\.?|৳|taka)/gi;

/**
 * Any number at all. Only consulted when no currency-adjacent amount was
 * found, and only for numbers immediately preceded by a transaction verb —
 * without that constraint this would happily match card digits, dates and
 * phone numbers.
 */
export const BARE_NUMBER = /[0-9][0-9.,]*[0-9]|[0-9]/g;

/** Left-context that proves a number is NOT the transaction amount. */
export const LEFT_VETO =
  /(bal(?:ance)?|avl|available|current|limit|fee|charge|chrg|vat|tax|discount|due|remaining|cashback)\s*[:\-]?\s*$/i;

/** Left-context that proves a number IS the transaction amount. */
export const LEFT_PREFER =
  /(debited|debited\s+by|paid|payment\s+of|purchase\s+of|spent|withdrawn|cash\s?out|sent|used\s+for|charged|amount)\s*[:\-]?\s*$/i;

export const GENERIC_MERCHANT =
  /\b(?:at|to|in\s+favou?r\s+of|towards)\s+([A-Z0-9][A-Za-z0-9&.'\-/ ]{2,40}?)(?=\s+(?:on|at|for|successful|is|has|TrxID|TxnID|Txn|Ref|Fee|Bal|Available)\b|[.,]|$)/;

export const GENERIC_REFERENCE =
  /\b(?:Trx\s?ID|Txn\s?Id|TxnID|Transaction\s?ID|Ref(?:erence)?(?:\s?No\.?)?|RRN|Journal\s?No)\s*[:\-#]?\s*([A-Za-z0-9]{4,24})\b/i;

export const GENERIC_ACCOUNT_TAIL =
  /(?:ending(?:\s+(?:with|in))?|no\.?|number|A\/C|Card|a\/c)\s*[:\-]?\s*(?:[xX*#]{2,}\s*)?(\d{4})\b/;

/** Symbol or code as written in the message → the code stored on the item. */
export const CURRENCY_CODES: { pattern: RegExp; code: string }[] = [
  { pattern: /\b(?:BDT|TK|Tk\.?|taka)\b|৳/i, code: 'BDT' },
  { pattern: /\b(?:INR|Rs\.?)\b|₹/i, code: 'INR' },
  { pattern: /\b(?:USD|US\$)\b|\$/i, code: 'USD' },
  { pattern: /\bEUR\b|€/i, code: 'EUR' },
  { pattern: /\bGBP\b|£/i, code: 'GBP' },
];

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

/**
 * Sender fragments handed to the native pre-filter so most of the inbox is
 * discarded in Kotlin instead of crossing the bridge. Matched case-insensitively
 * as substrings of the normalized sender, so they are deliberately loose.
 */
export const SENDER_HINTS = [
  'BKASH', '16247', 'NAGAD', '16167', 'ROCKET', '16216', 'UPAY', 'TAP',
  'BRAC', 'DBBL', 'CITY', 'EBL', 'IBBL', 'BANK', 'CARD', 'VISA', 'MASTERCARD',
];

/** Body fragments that keep a message alive through the native pre-filter. */
export const KEYWORD_HINTS = [
  'debited', 'debit', 'payment', 'purchase', 'spent', 'withdrawn', 'cash out',
  'credited', 'received', 'txnid', 'trxid', 'balance',
];

/**
 * Real-world samples, one per preset. These double as the rule editor's default
 * test fixtures — the parser is pure, so the editor can run them live.
 */
export const SMS_SAMPLES: Record<string, string> = {
  bkash:
    'You have made payment of Tk 450.00 to SHWAPNO SUPER SHOP. Fee Tk 0.00. Balance Tk 2,345.67. TrxID AI12B3CD4E at 05/11/2025 14:32',
  nagad:
    'Payment Successful. Amount: Tk 320.00, Merchant: AGORA GULSHAN, TxnID: 9RST5U6V, Balance: Tk 880.00',
  rocket:
    'Tk450.00 payment to SHWAPNO is successful. TxnId:123456789. Fee:Tk0.00. Balance:Tk2,345.67. 05-Nov-25 14:32',
  brac:
    'Dear Customer, your BRAC Bank Card ending 1234 has been used for BDT 2,500.00 at SHWAPNO DHANMONDI on 05-NOV-2025 14:32. Available balance BDT 45,000.00.',
  dbbl:
    'Your A/C 1234567890 has been debited by BDT 1,200.00 on 05/11/2025 for POS purchase at AGORA. Available Balance BDT 20,000.00.',
  citybank:
    'Your City Bank Card no. 4**** 1234 is used for BDT 3,200.00 at DARAZ on 05-Nov-2025 13:00. Avl Bal BDT 12,000.00',
  ebl:
    'Your EBL Card ending 1234 has been debited BDT 1,500.00 at UNIMART on 05-Nov-25. Available balance: BDT 30,000.00',
  ibbl:
    'Dear Customer, Your A/C 20501xxxxxxx has been debited by BDT 1,000.00 on 05/11/2025. Balance BDT 15,000.00',
  generic:
    'Your card ending 1234 was charged USD 45.00 at AMAZON on 11/05/25.',
};

/**
 * Matched in priority order, highest first. User rules are created at priority
 * 100 and so outrank every built-in — if someone writes a rule for their own
 * bank, it should win over our guess about it.
 */
export const SMS_PRESETS: TSmsRule[] = [
  {
    id: 'bkash',
    label: 'bKash',
    builtin: true,
    sender: /^(BKASH|16247)$/,
    currency: 'BDT',
    // bKash writes "to <name>" for merchant payments and "to <number>" for send
    // money; the digit case is filtered out by the generic merchant pattern's
    // leading [A-Z0-9] plus the length floor, so one pattern covers both.
    priority: 90,
  },
  {
    id: 'nagad',
    label: 'Nagad',
    builtin: true,
    sender: /^(NAGAD|16167)$/,
    currency: 'BDT',
    // Nagad labels everything, so "to X" never appears and the generic merchant
    // pattern finds nothing. This override is the whole reason Nagad needs one.
    merchant: /Merchant:\s*([^,]+)/i,
    reference: /TxnID:\s*([A-Za-z0-9]{4,24})/i,
    priority: 90,
  },
  {
    id: 'rocket',
    label: 'Rocket',
    builtin: true,
    sender: /^(ROCKET|16216|DBBLMOBILE)$/,
    currency: 'BDT',
    reference: /TxnId\s*:?\s*([A-Za-z0-9]{4,24})/i,
    priority: 90,
  },
  {
    id: 'brac',
    label: 'BRAC Bank',
    builtin: true,
    sender: /BRAC/,
    currency: 'BDT',
    // "has been used for BDT X at MERCHANT" — `used for` is already in
    // LEFT_PREFER, so only the merchant side needs anchoring.
    debit: /\b(used\s+for|debited|purchase|withdrawn)\b/i,
    priority: 80,
  },
  {
    id: 'dbbl',
    label: 'Dutch-Bangla Bank',
    builtin: true,
    sender: /^(DBBL|DUTCHBANGLA)$/,
    currency: 'BDT',
    priority: 80,
  },
  {
    id: 'citybank',
    label: 'City Bank',
    builtin: true,
    sender: /CITY\s*BANK|^CITYBANK$|^CITYTOUCH$/,
    currency: 'BDT',
    debit: /\b(is\s+used\s+for|used\s+for|debited|purchase)\b/i,
    priority: 80,
  },
  {
    id: 'ebl',
    label: 'Eastern Bank',
    builtin: true,
    sender: /^EBL/,
    currency: 'BDT',
    priority: 80,
  },
  {
    id: 'ibbl',
    label: 'Islami Bank',
    builtin: true,
    sender: /^IBBL/,
    currency: 'BDT',
    priority: 80,
  },
];

/**
 * The fallback when no preset's sender matches — international cards, banks we
 * have no preset for, anything new. Its sender pattern matches everything, so
 * it must stay at the bottom of the priority order.
 */
export const GENERIC_RULE: TSmsRule = {
  id: 'generic',
  label: 'Other',
  builtin: true,
  sender: /.*/,
  priority: 0,
};
