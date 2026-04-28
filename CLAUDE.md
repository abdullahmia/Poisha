# Ledger — Tracker App

A personal money journal built with React Native and Expo. The UI is intentionally calm and typographic — warm parchment tones, serif display font, no categories or budgets, just a log.

## Stack

- **Framework:** Expo SDK 54, Expo Router v6 (file-based navigation)
- **Language:** TypeScript (strict mode), React 19
- **Architecture:** New Architecture enabled (`newArchEnabled: true`)
- **Package manager:** Bun (`bun add`, `bun install`, `bun run`)
- **Fonts:** `@expo-google-fonts/fraunces` (serif display) + `@expo-google-fonts/dm-sans` (UI sans)
- **Storage:** `@react-native-async-storage/async-storage` (key: `tracker_entries`)
- **State:** React Context (`lib/context/entries.context.tsx`) — no Redux, no Zustand

## Commands

```bash
bun run start          # Expo dev server (then press i/a for iOS/Android)
bun run ios            # iOS simulator
bun run android        # Android emulator
bun run lint           # ESLint
npx tsc --noEmit       # Type check
```

Use `npx expo install <pkg>` (not `bun add`) for native packages so Expo picks the SDK-compatible version.

## Project Structure

```
app/
  _layout.tsx           # Root: font loading, SafeAreaProvider, EntriesProvider, AddEntrySheet
  (tabs)/
    _layout.tsx         # Custom tab bar (Home + Entries + FAB add button)
    index.tsx           # Home — monthly summary, daily bar chart, recent entries
    explore.tsx         # List — all entries grouped by date

lib/
  components/
    add-entry-sheet.component.tsx   # Animated slide-up modal (add / edit / delete)
    bar-chart.component.tsx         # View-based bar chart (no external chart library)
    entry-card.component.tsx        # Pressable card for a single entry
  constants/
    theme.ts                        # `ledger` color palette
  context/
    entries.context.tsx             # EntriesCtx + EntriesProvider (CRUD + sheet state)
  data/
    seed.data.ts                    # STORAGE_KEY + SEED_ENTRIES
  hooks/
    use-entries.hook.ts             # useEntries() consumer hook
  types/
    entry.type.ts                   # Entry interface + Draft type
```

## File Naming Convention

All files under `lib/` follow a `[name].[folder].ext` suffix convention:

| Folder | Suffix | Example |
|---|---|---|
| `lib/components/` | `.component.tsx` | `entry-card.component.tsx` |
| `lib/context/` | `.context.tsx` | `entries.context.tsx` |
| `lib/hooks/` | `.hook.ts` | `use-entries.hook.ts` |
| `lib/types/` | `.type.ts` | `entry.type.ts` |
| `lib/data/` | `.data.ts` | `seed.data.ts` |
| `lib/constants/` | `.ts` | `theme.ts` |

**Always place new code in `lib/` following this convention.** Never create `components/`, `context/`, `hooks/`, or `constants/` at the project root.

## Data Model

```typescript
interface Entry {
  id: string;        // 's1'/'s2'/... (seed) or 'e_<timestamp>'
  date: string;      // 'YYYY-MM-DD'
  amounts: number[]; // one or more line items per entry
  note: string;      // optional free-text label
}
```

Entries are stored as a JSON array in AsyncStorage under the key `tracker_entries`. Seed data is written on first launch.

## Theme

All colors live in `lib/constants/theme.ts` as the `ledger` object. Never hardcode hex values — always import from there.

```
bg          #efe8d8   page background (warm parchment)
surface     #fbf6ea   cards, inputs
surfaceAlt  #e5dbc4   secondary fills
ink         #1d1712   primary text, active tab, buttons
inkSoft     #6b5d4a   secondary text
inkMuted    #9c8c72   placeholders, labels
accent      #b8441f   brand red (totals, multi-entry highlights)
accentSoft  #e8cfbf   accent backgrounds
line        #d8cdb3   borders, dividers, empty bars
```

## Fonts

Fonts are loaded in `app/_layout.tsx` via `useFonts`. Always use the full variant name as `fontFamily`:


| Token | Font family value |
|---|---|
| Serif display (light italic) | `Fraunces_300Light_Italic` |
| Serif display (regular italic) | `Fraunces_400Regular_Italic` |
| Serif display (medium italic) | `Fraunces_500Medium_Italic` |
| Serif display (semibold) | `Fraunces_600SemiBold` |
| Serif display (semibold italic) | `Fraunces_600SemiBold_Italic` |
| UI sans (regular) | `DMSans_400Regular` |
| UI sans (medium) | `DMSans_500Medium` |
| UI sans (semibold) | `DMSans_600SemiBold` |
| UI sans (bold) | `DMSans_700Bold` |

## Key Patterns

**Adding a new screen triggered from any tab:** put open/close state in `EntriesCtx` (same pattern as `sheetOpen`/`openAdd`/`closeSheet`) and render the modal in `app/_layout.tsx`.

**Date parsing:** always parse ISO dates as `new Date(y, m-1, d)` to avoid timezone shifts — never `new Date(isoString)` directly.

**Safe area:** use `useSafeAreaInsets()` for padding instead of hardcoded values. The bottom nav bar is `position: 'absolute'` with height ~110px, so scrollable screens need `paddingBottom: 110 + insets.bottom`.

**No recharts / no SVG library:** the bar chart is plain `View` components with proportional heights. Keep it that way unless a significantly richer chart is needed.

## Files to Ignore

- `tracker-app.jsx` — original React web source, kept for reference only
