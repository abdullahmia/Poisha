# Feature: Settings Screen

## Overview

Add a **Settings** tab to the bottom navigation bar. The settings screen exposes app-level preferences, starting with an Appearance section that lets the user toggle between Light and Dark themes. The chosen theme is persisted and applied globally across the app.

---

## Scope

- New **Settings** tab (third tab in the tab bar)
- **Appearance** section with a Light / Dark theme toggle
- Theme preference persisted to `AsyncStorage` under the key `ledger_theme`
- A `ThemeContext` that exposes the active palette and the toggle function to the entire app
- All existing screens and components switch to consuming theme colors from context instead of directly importing `ledger`

---

## Navigation

Add a `settings` screen to `app/(tabs)/`:

```
app/(tabs)/
  index.tsx       # Home
  explore.tsx     # Entries
  settings.tsx    # Settings  ← new
```

Update `app/(tabs)/_layout.tsx` to register the new tab. Add a settings icon (use `Settings01Icon` from `@hugeicons/core-free-icons`) to the `TABS` array alongside Home and Entries.

---

## Theme Tokens

Define **two complete palettes** inside `lib/constants/theme.ts`. Both must export the same set of keys so consumers are interchangeable.

### Dark palette (current, keep as-is)

```ts
export const darkTheme = {
  bg:          '#0c0c0e',
  surface:     '#141416',
  surfaceAlt:  '#1e1e22',
  ink:         '#f0ece5',
  inkSoft:     '#98918a',
  inkMuted:    '#524c46',
  accent:      '#ff5c35',
  accentSoft:  '#221008',
  line:        '#242428',
} as const;
```

### Light palette (warm parchment)

```ts
export const lightTheme = {
  bg:          '#efe8d8',
  surface:     '#fbf6ea',
  surfaceAlt:  '#e5dbc4',
  ink:         '#1d1712',
  inkSoft:     '#6b5d4a',
  inkMuted:    '#9c8c72',
  accent:      '#b8441f',
  accentSoft:  '#e8cfbf',
  line:        '#d8cdb3',
} as const;
```

Keep `export const ledger = darkTheme` as a backwards-compatible alias so nothing breaks before the migration is complete.

---

## ThemeContext

**File:** `lib/context/theme.context.tsx`

```ts
export type ColorScheme = 'light' | 'dark';

export interface ThemeCtxValue {
  scheme: ColorScheme;
  colors: typeof darkTheme;   // same shape for both
  toggleScheme: () => void;
}

export const ThemeCtx = createContext<ThemeCtxValue | null>(null);
```

- On mount, read `ledger_theme` from AsyncStorage; default to `'dark'` if absent.
- `toggleScheme` flips the scheme and persists the new value.
- Expose a `useTheme()` hook in `lib/hooks/use-theme.hook.ts`.

**Wire up in `app/_layout.tsx`:** wrap the entire tree with `<ThemeProvider>` **outside** `<EntriesProvider>` so every screen has access.

---

## Settings Screen (`app/(tabs)/settings.tsx`)

### Structure

```
Settings
└── Section: Appearance
    └── Row: Theme
        ├── Label: "Theme"
        ├── Sub-label: "Dark" | "Light"
        └── Toggle switch (right-aligned)
```

### Behaviour

- The `Switch` (React Native built-in) reflects the current scheme.
- Toggling it calls `toggleScheme()` from `useTheme()`.
- The entire screen background and text adapt immediately to the new theme.

### Layout

- Full-screen scroll view with `paddingBottom: 110 + insets.bottom` (same rule as other scrollable screens).
- Section header: small all-caps label (`DMSans_500Medium`, 11px, `inkMuted` color), 24px top margin.
- Row: `surface` background, 16px vertical padding, horizontal rule (`line` color, 1px) between rows within a section.
- No custom icons needed inside rows — keep it typographic.

---

## Component / Hook Migration

After `ThemeContext` is in place, update every file that currently does `import { ledger } from '@/lib/constants/theme'` inside a component or hook to instead call `useTheme().colors`. Files to update:

- `app/(tabs)/_layout.tsx`
- `app/(tabs)/index.tsx`
- `app/(tabs)/explore.tsx`
- `lib/components/add-entry-sheet.component.tsx`
- `lib/components/bar-chart.component.tsx`
- `lib/components/entry-card.component.tsx`

Static, non-component files (e.g. `StyleSheet.create` calls that run at module load time) must be converted to inline styles or `useMemo`-derived style objects so they react to the live theme.

---

## Acceptance Criteria

1. A "Settings" tab appears in the bottom nav bar and is reachable.
2. The Appearance row displays "Dark" or "Light" matching the active scheme.
3. Toggling the switch changes the app theme instantly with no reload.
4. After a full app restart the previously chosen theme is restored.
5. Both themes display all text at readable contrast (no hardcoded hex values remaining in component files).
6. TypeScript compiles with no errors (`npx tsc --noEmit`).
