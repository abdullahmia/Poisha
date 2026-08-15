# Settings Restructure (monochrome palette reverted)

> **Status:** `[x] Implemented — structure only.` Phases 2–6 shipped. **Phases 0, 1 and 7 were reverted**: the monochrome palette was built, reviewed and rejected, and the warm light/dark palette is back exactly as it was. The Settings restructure, the System theme mode and the notification-channel split all stayed.
> **Effort:** Large (9 new screens, one net-new theme mode, one flag split)
> **Reference:** the supplied settings mockup — hairline row lists, large bold titles, sub-screen navigation. The *layout* was adopted; the *colour* was not.

> **Why the palette was reverted:** the warm accent is the app's identity, and monochrome traded it for a look that didn't feel like Poisha. The structural argument in Phase 2 stood on its own and survives; the colour argument in the "Why" below did not.
>
> Phases 0/1/7 are kept in this document rather than deleted, because they record exactly what a future monochrome attempt would have to redo — in particular the white-on-accent hazard in Phase 1, which is invisible until it ships.

## Why

Two changes that happen to reinforce each other:

1. **Settings has outgrown one screen.** It's currently eight stacked card sections in a single scroll — Appearance, Region, Data, Budget, Planning, Categories, Security, Updates. Everything is visible at once and nothing has room to explain itself. The mockup's pattern (a lean nav menu pushing to focused sub-screens) fits far better, and it's the only way the Appearance and Notifications screens get space for previews and descriptions.
2. **The warm palette fights the content.** Poisha's peach/terracotta accent competes with the eight category colours, which are the one place colour actually carries meaning. Going monochrome hands colour back to the data.

## Scope decisions

1. **Monochrome means neutral greys plus two survivors: `danger` red and category colours.** Destructive actions stay red (the mockup does this too — "Delete account" is red on soft pink). Category colours stay exactly as they are: they're user data, not chrome, and desaturating them would destroy the one signal that needs to be scannable.
2. **`accent` becomes ink-coloured and therefore *inverts* between themes** — near-black in light, near-white in dark. This is what makes the swap mostly free, and also what creates the one real hazard (see Phase 1).
3. **Instant apply everywhere.** The mockup shows a `Save` button on its Appearance screen; we're not adopting it. The app applies preferences immediately everywhere else, and a staged-edit model would mean a user who picks a theme and swipes back loses it.
4. **Flat route names, not a `settings/` folder.** `app/(tabs)/settings.tsx` already owns `/settings`; adding `app/settings/appearance.tsx` invites a route collision. Use `app/settings-appearance.tsx` etc., matching the existing `app/category-management.tsx` precedent.
5. **No auth, so no "Log out" / "Delete account".** The mockup's account rows have no analogue — Poisha has a PIN lock, not accounts. `Reset all data` is the nearest equivalent and takes the destructive-row treatment.

---

## The palette

Replace both `lib/constants/theme.constants.ts` and the CSS variables in `global.css` (they must stay in lockstep — `className` colours read the CSS vars, inline `colors.*` reads the TS object).

| Token | Light | Dark | Note |
|---|---|---|---|
| `bg` | `#ffffff` | `#09090b` | |
| `surface` | `#fafafa` | `#131316` | far less lift than today — the mockup is nearly flat |
| `surfaceAlt` | `#f4f4f5` | `#1c1c20` | |
| `ink` | `#09090b` | `#fafafa` | |
| `inkSoft` | `#52525b` | `#a1a1aa` | |
| `inkMuted` | `#a1a1aa` | `#52525b` | |
| **`accent`** | **`#09090b`** | **`#fafafa`** | **inverts — see Phase 1** |
| `accentSoft` | `#f4f4f5` | `#1c1c20` | |
| `line` | `#e4e4e7` | `#26262a` | |
| `shadow` | `#000000` | `#000000` | |
| `danger` | `#e11d48` | `#fb7185` | survives |
| `dangerSoft` | `#ffe4e6` | `#2d1418` | survives |

---

## Phase 0 — Palette swap — REVERTED

The cheap part. `accent` is a token, so all 80 references across 37 files follow automatically.

- [ ] Rewrite `LIGHT_THEME` / `DARK_THEME` in `lib/constants/theme.constants.ts`
- [ ] Rewrite `:root` and `.dark:root` vars in `global.css` to match exactly
- [ ] Soften `Card`'s shadow in `lib/ui/card.ui.tsx` (`shadowOpacity: 0.12` → ~`0.05`) — a warm-brown shadow reads as depth, a pure-black one reads as dirt
- [ ] Visual pass in both themes; confirm nothing became invisible

## Phase 1 — Fix the white-on-accent inversion ⚠️ — REVERTED

**Do not skip, and do it in the same commit as Phase 0.** Today `accent` is orange in both themes, so hardcoded white text on an accent fill works. Once `accent` becomes near-white in dark mode, **white-on-accent is white-on-white — invisible**. `text-bg` is the correct replacement: `bg` is the exact inverse of `accent` in both themes.

Confirmed sites:

- [ ] `lib/ui/button.ui.tsx:28` — `solid: 'text-white'` → `text-bg`
- [ ] `lib/components/explore/period-selector.component.tsx:50` — selected chip label
- [ ] `lib/components/explore/category-filter-chips.component.tsx:43` — selected chip label
- [ ] `lib/components/settings/budget-sheet.component.tsx:43` — Save label
- [ ] `lib/components/settings/currency-symbol-sheet.component.tsx:37` — Save label
- [ ] `lib/components/settings/category-management-screen.component.tsx:119,161,162` — FAB icon, Add icon + label (`#ffffff` → `colors.bg`)
- [ ] `lib/components/settings/category-form-sheet.component.tsx:108` — Save label
- [ ] `lib/components/home/home-header.component.tsx` — currency glyph on the accent circle (`text-bg` already; verify)
- [ ] Leave `lib/ui/button.ui.tsx:31` (`danger`) and `swipeable-entry-card.component.tsx:40,41` alone — those sit on `danger` red, which stays red in both themes
- [ ] Grep sweep afterwards: `text-white`, `#ffffff`, `#fff` — every remaining hit must be on a red background

## Phase 2 — Settings root as a nav menu

Rebuild `app/(tabs)/settings.tsx`. Delete the eight card sections; replace with grouped hairline rows.

```
Settings                        ← large bold, left-aligned

General
  Appearance                 ›
  Notifications              ›
  Features                   ›
  Budget                     ›
  Region                     ›
  Security                   ›

Data
  Import & Export            ›
  Reset all data             ›   ← danger red

Support
  About & Updates            ›
```

- [x] New `lib/components/settings/settings-nav-row.component.tsx` — icon + label + chevron, optional value text, optional `destructive`
- [x] New `lib/components/settings/settings-group.component.tsx` — group label + hairline-separated rows
- [x] New `lib/components/settings/screen-header.component.tsx` — shared back-arrow + title for every sub-screen
- [x] Rewrite `app/(tabs)/settings.tsx` to the nav menu
- [x] Replace `settings-hero.component.tsx` with the mockup's plain large title
- [x] Retire `settings-styles.constants.ts` row styles or repoint them at the new row

## Phase 3 — Appearance screen (includes net-new System mode)

**This is the largest single phase** — `TColorScheme` is `'light' | 'dark'` today, with no System option. Adding it means separating *preference* from *resolved scheme*.

- [x] `lib/types/theme.types.ts` — add `TThemePreference = 'light' | 'dark' | 'system'`, keep `TColorScheme` as the resolved value
- [x] `lib/hooks/use-theme.hook.ts` — resolve `system` via `Appearance.getColorScheme()`, subscribe to `Appearance.addChangeListener` so an OS switch repaints live, keep the NativeWind sync
- [x] Migrate the stored value: an existing `'light'`/`'dark'` string stays valid, so no migration needed — confirm the query tolerates the new third value
- [x] Replace `toggleScheme` with `setPreference(pref)`; update every caller
- [x] New `app/settings-appearance.tsx` + `lib/components/settings/appearance-screen.component.tsx`
- [x] Three preview cards (Light / Dark / System) with radio dots, per the mockup — **instant apply, no Save button**
- [x] Keep the existing `ThemeTransitionProvider` flash on change
- [x] Move Haptic Feedback off this screen → Features (Phase 5)

## Phase 4 — Notifications screen (includes flag split)

Today one `notificationsEnabled` flag gates both the budget alert and the plan-due reminders. The mockup's grouped-toggle layout needs them separable.

```
Notifications

Allow notifications          [●]
  Permission for Poisha to send you alerts.

Spending
  Budget alerts              [●]
  When this month's spending passes your budget.

Planning
  Planned entry reminders    [●]
  At 9:00 AM on the day a planned entry starts counting.
```

- [x] New storage keys `budgetAlertsEnabled`, `planRemindersEnabled`; new query keys
- [x] New services under `lib/services/notifications/` for both, mirroring the existing pair
- [x] **Default both to `true`** so existing users see no behaviour change when the split lands
- [x] `lib/utils/budget-notification.util.ts` — gate on master **and** `budgetAlertsEnabled`
- [x] `lib/utils/plan-notification.util.ts` — gate on master **and** `planRemindersEnabled`; call `syncPlanDueNotifications()` when that toggle changes
- [x] Sub-toggles disabled/greyed when the master is off
- [x] New `app/settings-notifications.tsx` + screen component
- [x] Fix `README.md` — it claims "daily reminders" that have never existed

## Phase 5 — Features screen

The "service enable" screen: everything that turns a capability on or off.

- [x] New `app/settings-features.tsx` + screen component
- [x] Plan Mode toggle (move from `planning-section.component.tsx`)
- [x] Categories toggle + `Manage categories ›` → existing `/category-management`
- [x] Haptic Feedback toggle (moved from Appearance)
- [x] Each with a one-line description under the label, per the mockup
- [x] Delete `planning-section.component.tsx` and `categories-section.component.tsx`

## Phase 6 — Remaining sub-screens

- [x] `app/settings-budget.tsx` — monthly budget; inline field, retire `budget-sheet.component.tsx`
- [x] `app/settings-region.tsx` — currency symbol + number format; retire `currency-symbol-sheet.component.tsx` and the iOS `Alert.prompt` branch
- [x] `app/settings-security.tsx` — App Lock, Change PIN, biometric (keep `PinSetupSheet` as-is)
- [x] `app/settings-data.tsx` — Export CSV, Import CSV, CSV format info, Reset all data (destructive, keeps its `ConfirmModal`)
- [x] `app/settings-about.tsx` — version, OTA update check (from `updates-section.component.tsx`)
- [x] Delete the superseded section components once each screen lands

## Phase 7 — App-wide monochrome sweep — REVERTED

Phase 0 makes these *correct*; this phase makes them *good*. Orange carried visual weight that black/white distributes differently.

- [ ] `lib/components/common/bar-chart.component.tsx` — check the 30%-opacity planned ghost bars still read against solid bars
- [ ] `lib/components/home/budget-bar.component.tsx` — same for the projected ghost fill
- [ ] `lib/components/plan/plan-month-budget.component.tsx` — same two-segment bars
- [ ] `lib/components/plan/plan-summary.component.tsx` — "Projected" was accent-coloured for emphasis; may need weight instead of colour
- [ ] `lib/components/explore/stats-grid.component.tsx` — `Card variant="accent"` now reads as flat grey; consider a border instead
- [ ] `app/(tabs)/_layout.tsx` — active tab colour; confirm the dot indicator still reads
- [ ] `lib/components/pin/*` — lock screen, PIN dots, onboarding progress
- [ ] `lib/components/entries/entry-card.component.tsx` — multi-amount accent stripe vs category stripe now compete differently
- [ ] `lib/ui/confirm-modal.ui.tsx`, `date-picker.ui.tsx` — selected states

## Phase 8 — Verify

- [x] `bunx tsc --noEmit` — no new errors beyond the 2 known pre-existing
- [x] `bun run lint` — 0 errors
- [x] `bunx expo export --platform ios` — bundles
- [ ] **Run on a device** — every screen, both themes, System mode following an OS switch live
- [ ] Toggle Plan Mode off/on and confirm the tab and Features rows behave
- [ ] Update `README.md` screenshots section (all six are now stale)

---

## Risks

- **Phase 1 is a hard dependency of Phase 0.** Shipping the palette without the white-on-accent fix leaves invisible button labels in dark mode. Same commit, always.
- **Phase 3 touches every `useTheme()` consumer** (37 files reference the palette). The `toggleScheme` → `setPreference` change is the breaking one; do it in one pass.
- **Phase 4 changes notification behaviour.** Defaulting the new sub-flags to `true` is what keeps it invisible to existing users — getting that wrong silently disables alerts for everyone.
- **The screenshots in `README.md` all become wrong** after Phase 0. Cosmetic, but they're the first thing anyone sees.

## Suggested order

Phases 0+1 together (one commit, immediately visible), then 2 (the new skeleton), then 3/4/5 in any order (independent screens), then 6, then 7, then 8. Each of 3–6 is independently shippable — a half-migrated Settings still works, since the root menu links to whatever exists.
