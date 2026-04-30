# Feature: Currency & Locale Formatting Setting

## Status

> **Not started**

---

## Overview

The currency symbol (`৳`) and number format are currently hardcoded in every screen. This feature extracts all formatting into a shared utility, adds a Settings section where the user can change the currency symbol and decimal separator, and wires the preference through a new hook so every visible amount updates immediately.

---

## Scope

- Settings section "Region" with currency symbol input and decimal separator selector
- New `lib/utils/format.util.ts` with locale-aware `fmt` and `fmtFull`
- New `lib/hooks/use-locale.hook.ts` to load/save/provide locale
- Remove all inline `fmt` / `fmtFull` definitions from screens and components
- Preference persisted in AsyncStorage
- Live update — changing the symbol in Settings updates amounts app-wide without restart
- Out of scope: full i18n, RTL support, number parsing locale (input always uses `.` decimal)

---

## Package

No new packages required.

---

## Storage

| Key | Value | Notes |
|---|---|---|
| `poisha_locale` | JSON string `{"symbol":"৳","decimalComma":false}` | Default: `৳`, period decimal |

---

## Utility Module

**File:** `lib/utils/format.util.ts`

```ts
export interface Locale {
  symbol: string;       // e.g. '৳', '$', '€'
  decimalComma: boolean; // true → 1.234,56 style; false → 1,234.56 style
}

export const DEFAULT_LOCALE: Locale = { symbol: '৳', decimalComma: false };

/**
 * Compact format — uses k suffix for values >= 1000.
 * e.g. 1234 → "৳1.2k", 950 → "৳950"
 */
export function fmt(n: number, locale: Locale = DEFAULT_LOCALE): string;

/**
 * Full format with thousand separators.
 * e.g. 1234567 → "৳1,234,567" (or "৳1.234.567" if decimalComma)
 */
export function fmtFull(n: number, locale: Locale = DEFAULT_LOCALE): string;
```

### `fmtFull` implementation notes

- Use `Intl.NumberFormat` with `maximumFractionDigits: 0` for integer amounts.
- For `decimalComma: true` swap `.` and `,` in the resulting string after formatting with the en-US locale as a base (or use `'de-DE'` locale directly).
- Prepend `locale.symbol` without a space.

### `fmt` implementation notes

- If `n >= 1000`: `locale.symbol + (n / 1000).toFixed(1) + 'k'` with decimal replaced if `decimalComma`.
- Otherwise: `locale.symbol + String(Math.round(n))`.

---

## Hook

**File:** `lib/hooks/use-locale.hook.ts`

```ts
interface UseLocaleReturn {
  locale: Locale;
  setLocale: (l: Partial<Locale>) => Promise<void>;
  fmt: (n: number) => string;
  fmtFull: (n: number) => string;
}

export function useLocale(): UseLocaleReturn;
```

**Behaviour:**
- On mount: read `poisha_locale` from AsyncStorage; parse JSON; fall back to `DEFAULT_LOCALE` on error.
- `setLocale(partial)`: merge with current locale, persist to AsyncStorage, update in-memory state.
- Exposes `fmt` and `fmtFull` pre-bound with the current locale so call sites just write `fmt(amount)`.

---

## Refactor: Remove Inline Formatters

The following files currently define their own `fmt` / `fmtFull` inline. Replace each with `useLocale()`.

| File | Current inline fn | Change |
|---|---|---|
| `app/(tabs)/index.tsx` | `fmt`, `fmtFull` | `const { fmt, fmtFull } = useLocale();` |
| `app/(tabs)/explore.tsx` | `fmt`, `fmtFull` | `const { fmt, fmtFull } = useLocale();` |
| `app/(tabs)/settings.tsx` | `fmtFull` (if any) | `const { fmtFull } = useLocale();` |
| `lib/components/add-entry-sheet.component.tsx` | currency prefix `৳` in `TextInput` | Replace hardcoded `৳` with `locale.symbol` |
| `lib/components/entry-card.component.tsx` | amount display | `const { fmtFull } = useLocale();` |

**Do not** leave any hardcoded `৳` symbols in display strings after this change.

---

## Settings Integration

**File:** `app/(tabs)/settings.tsx`

Add a **Region** section (below Appearance, above Data):

```
Section: Region

  Row: Currency Symbol
    Left:   "Currency Symbol"
    Right:  current symbol (e.g. "৳") in inkSoft
    Press:  opens inline text input or a small bottom sheet

  Row: Number Format
    Left:   "Number Format"
    Right:  segmented control with two options:
              "1,234.56"  (decimalComma: false — default)
              "1.234,56"  (decimalComma: true)
```

### Currency Symbol Input

Tapping the Currency Symbol row opens a small `Alert.prompt` (iOS) or an inline modal with a single `TextInput` (Android — `Alert.prompt` is iOS-only):

```
Title:       "Currency Symbol"
Placeholder: "৳"
maxLength:   3
keyboardType: "default"
Actions:     [Cancel]  [Save]
```

On Save: call `setLocale({ symbol: trimmed || '৳' })`. If the user clears the field and saves, fall back to `৳`.

### Number Format segmented control

Toggle directly in the row (no sheet):

```ts
<Pressable onPress={() => setLocale({ decimalComma: !locale.decimalComma })}>
  ...
</Pressable>
```

Live preview line below the control:
```
Preview: ৳1,234.56
```
Updates as the user toggles.

---

## File Checklist

```
lib/
  utils/
    format.util.ts                 # new — fmt, fmtFull, Locale type, DEFAULT_LOCALE
  hooks/
    use-locale.hook.ts             # new — load/save/provide locale

app/
  (tabs)/
    index.tsx                      # replace inline fmt/fmtFull with useLocale()
    explore.tsx                    # replace inline fmt/fmtFull with useLocale()
    settings.tsx                   # Region section + setLocale calls

lib/
  components/
    add-entry-sheet.component.tsx  # replace hardcoded ৳ with locale.symbol
    entry-card.component.tsx       # replace inline amount formatting
```

---

## Acceptance Criteria

1. Default currency symbol is `৳`; existing behavior is unchanged after merge.
2. Changing the currency symbol in Settings immediately updates all visible amounts on all screens without restarting the app.
3. Switching the number format immediately changes the separator style on all formatted amounts.
4. The `AddEntrySheet` amount row prefix reflects the current symbol.
5. Locale preference survives app restart.
6. Clearing the currency symbol field defaults back to `৳`.
7. No hardcoded `৳` string remains in any display path.
8. `npx tsc --noEmit` passes with no errors.
