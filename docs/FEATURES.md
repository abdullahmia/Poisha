# Poisha — Feature Inventory & Roadmap

## Spec Index

### Completed (`specs/done/`)

| Feature | Spec |
|---------|------|
| App Lock with PIN | [app-lock-pin.md](../specs/done/app-lock-pin.md) |
| Biometric Authentication | [biometric-authentication.md](../specs/done/biometric-authentication.md) |
| CSV Export & Import | [csv-export-import.md](../specs/done/csv-export-import.md) |
| Settings Screen | [settings-screen.md](../specs/done/settings-screen.md) |
| SQLite Local Database | [sqlite-database.md](../specs/done/sqlite-database.md) |

### Todo / In Progress (`specs/todo/`)

| # | Feature | Spec | Status |
|---|---------|------|--------|
| 1 | Haptic feedback | [haptic-feedback.md](../specs/todo/haptic-feedback.md) | Not started |
| 2 | Home-screen widget | [home-screen-widget.md](../specs/todo/home-screen-widget.md) | Not started |
| 3 | Monthly budget indicator | [monthly-budget-indicator.md](../specs/todo/monthly-budget-indicator.md) | Not started |
| 4 | Entry search | [entry-search.md](../specs/todo/entry-search.md) | Not started |
| 5 | Swipe to delete | [swipe-to-delete.md](../specs/todo/swipe-to-delete.md) | Not started |
| 6 | Currency / locale setting | [currency-locale-setting.md](../specs/todo/currency-locale-setting.md) | Not started |
| 7 | Shake to undo | [shake-to-undo.md](../specs/todo/shake-to-undo.md) | Not started |

---

## Existing Features

---

### 1. Entry Management

**Core CRUD**
- Add a new entry with one or more amount line items and an optional note
- Edit any existing entry (amounts, note, date)
- Delete an entry from the edit sheet
- Date picker (calendar modal, capped at today — no future dates)
- Multiple amounts per entry (line-item breakdown within a single log)
- Real-time total shown in the sheet as amounts are entered
- Input validation: at least one non-zero amount required to save

**Storage**
- SQLite database via `expo-sqlite` (migrated from AsyncStorage on first launch)
- Amounts stored as a JSON array column so the data model is flexible
- Seed data injected on first launch so the app isn't empty

---

### 2. Home Screen (Dashboard)

- Brand header ("Poisha / a quiet money journal")
- Month selector — navigate backwards to any past month; forward capped at current month
- Hero total: large typographic display of total spending for the selected month
- Stats row: entry count, total item count, average spend per day
- Bar chart: daily spending flow for the selected month (plain `View`-based, no SVG library), with peak-day indicator
- Recent entries section: last 4 entries for the selected month
- Empty state when no data exists for the selected month
- Staggered entrance animations (5 sections, 70 ms stagger, cubic-out easing)

---

### 3. Entries / Browse Screen

- Full entry list grouped by date
- Period selector pills: **Day · Week · Month · Year · All**
- Date-range navigator (prev / next arrows) that respects the selected period
- Stats grid (2×2):
  - Total spent
  - Average per item or per day (context-dependent)
  - Number of entries
  - Highest single entry in the period
- Sort controls: **Newest · Oldest · Highest ৳ · Lowest ৳**
- Automatic date grouping when sorting by date
- Period-specific empty state messaging

---

### 4. Security — App Lock

**PIN**
- Mandatory onboarding wizard on first launch (Welcome → Create PIN → Confirm PIN → Biometric)
- 4-digit PIN creation with confirmation step
- PIN stored hashed (SHA-256 + random salt) in `expo-secure-store`
- Automatic legacy migration: plaintext PINs from older builds are rehashed on first unlock
- Lock activates automatically when app is backgrounded
- Lock screen with numeric keypad for PIN entry
- 5-attempt lockout with 30-second cooldown; lockout state persisted across sessions
- Animated circular progress timer during lockout
- PIN change: verify old → set new (3-step flow from Settings)
- PIN disable: verify current PIN before turning off

**Biometric**
- Supports Face ID and Fingerprint (detected at runtime)
- Optional step in PIN onboarding wizard
- Automatic biometric prompt when app resumes from background
- Re-enroll biometric option in Settings
- Graceful fallback if biometric becomes unavailable (banner warning + PIN fallback)
- Enable/disable independently from PIN lock

---

### 5. Data Import / Export

- **Export CSV**: serializes all entries to a CSV file (with proper escaping) and triggers the native share sheet
- **Import CSV**: document picker → parse CSV → merge-or-replace confirmation dialog → database update
- **Reset All Data**: wipe all entries after a confirmation dialog

---

### 6. Theming

- Light and dark color schemes
- Toggle in Settings with an animated switch
- Preference persisted to AsyncStorage and restored on launch
- All 11 palette tokens applied consistently across every screen and component
- Status bar style adapts to the active scheme

---

### 7. UI & Animations

- Custom bottom tab bar with an animated pill indicator (spring physics)
- Central FAB-style "+" add button in the tab bar
- `AddEntrySheet` slides up with spring animation and a darkening backdrop
- Entry cards: left accent stripe for multi-item entries, press scale/opacity feedback
- Lock screen: shake animation on wrong PIN, pulsing ring, lockout countdown
- PIN input: shake animation on mismatch, 4-dot progress indicator
- `PinSetupSheet`: animated slide-up/down

---

### 8. Navigation & Architecture

- Expo Router v6 file-based routing
- Provider hierarchy: `SafeAreaProvider → ThemeProvider → LockProvider → EntriesProvider`
- Lock gate in root layout: shows `PinOnboarding` or `LockScreen` before the tab navigator
- `AddEntrySheet` rendered at root layout level (accessible from any tab)
- Sheet and modal state managed in `EntriesContext` so any screen can open the sheet

---

### 9. Fonts & Typography

- **Fraunces** (serif): display headings, totals, brand name — loaded in 5 weights
- **DM Sans** (sans): body, labels, UI text — loaded in 4 weights
- **Space Grotesk** + **Inter** also bundled (used in some UI elements)

---

### 10. Developer / Config

- TypeScript strict mode throughout
- New Architecture (`newArchEnabled: true`) + React Compiler experiment enabled
- `Bun` as package manager
- ESLint configured with Expo preset
- `lib/` naming convention enforced (`*.component.tsx`, `*.hook.ts`, etc.)
- Currency symbol: ৳ (Bangladeshi Taka) hardcoded in formatting helpers

---

## Suggested New Features

The suggestions below are ordered roughly by effort (small → large) and grouped by theme. Each is self-contained and additive — none requires rethinking the existing architecture.

---

### Quick Wins (1–2 days each)

| # | Feature | Spec | Status |
|---|---------|------|--------|
| 1 | Haptic feedback on key interactions | [haptic-feedback.md](../specs/todo/haptic-feedback.md) | Not started |
| 2 | "Today at a glance" home-screen widget | [home-screen-widget.md](../specs/todo/home-screen-widget.md) | Not started |
| 3 | Running monthly budget indicator | [monthly-budget-indicator.md](../specs/todo/monthly-budget-indicator.md) | Not started |
| 4 | Entry search | [entry-search.md](../specs/todo/entry-search.md) | Not started |
| 5 | Swipe to delete on entry cards | [swipe-to-delete.md](../specs/todo/swipe-to-delete.md) | Not started |
| 6 | Currency / locale formatting setting | [currency-locale-setting.md](../specs/todo/currency-locale-setting.md) | Not started |
| 7 | Shake to undo last entry | [shake-to-undo.md](../specs/todo/shake-to-undo.md) | Not started |

---

#### 1. Haptic feedback on key interactions
> **Status:** `[ ] Not started`

**Why:** `expo-haptics` is already installed. No new dependency needed.

**Requirements:**
- [ ] PIN keypad — light impact (`Haptics.ImpactFeedbackStyle.Light`) on every digit tap and backspace
- [ ] Wrong PIN / mismatch — error notification (`Haptics.NotificationFeedbackType.Error`) fires at the start of the shake animation
- [ ] Lockout triggered — heavy notification feedback to signal the hard stop
- [ ] Entry saved successfully — success notification (`Haptics.NotificationFeedbackType.Success`) when "Log Entry" / "Save Changes" completes
- [ ] Entry deleted — warning notification feedback on delete confirmation
- [ ] Tab switch — light selection feedback (`Haptics.selectionAsync()`) when switching tabs
- [ ] Add button (+) tap — medium impact feedback
- [ ] No new package required; import `expo-haptics` in the affected components only

**Files to touch:** `lib/components/pin-input.component.tsx`, `lib/components/lock-screen.component.tsx`, `lib/components/add-entry-sheet.component.tsx`, `app/(tabs)/_layout.tsx`

---

#### 2. "Today at a glance" home-screen widget (iOS / Android)
> **Status:** `[ ] Not started`

**Why:** High perceived value — users see spend without opening the app.

**Requirements:**
- [ ] Widget shows today's date, total spend for today (sum of all entry amounts where `date === today`), and the app name/icon
- [ ] iOS: use `expo-widgets` (experimental in Expo 54) or a bare Swift widget extension; Android: App Widget via a native module or `react-native-android-widget`
- [ ] Widget reads from a shared SQLite file path (or a separate lightweight JSON written by the app on every save) so it doesn't need to launch the full RN runtime
- [ ] Widget updates whenever the app saves or deletes an entry (write a shared JSON snapshot to the app group container)
- [ ] Tapping the widget deep-links to the app's Home tab
- [ ] Widget background and text colors match the current app theme (light/dark) — use static assets since widgets cannot read AsyncStorage at runtime
- [ ] Fallback: if today has no entries, show "৳ 0 today"

**Files to touch:** New native extension / `lib/utils/widget-snapshot.util.ts` (write JSON on every save), `lib/context/entries.context.tsx` (call snapshot writer after upsert/delete)

---

#### 3. Running monthly budget indicator
> **Status:** `[ ] Not started`

**Why:** The most-requested feature in personal finance journals; requires no new dependency.

**Requirements:**
- [ ] New Settings row "Monthly Budget" — numeric input, optional (empty = disabled)
- [ ] Budget value persisted in AsyncStorage under key `poisha_monthly_budget`
- [ ] When a budget is set, the Home screen hero section gains a horizontal progress bar below the total: `spent / budget` with a percentage label
- [ ] Bar fills with `theme.accent` up to 80%; turns `#e84040` (danger red) above 100%
- [ ] At exactly 100% a one-time warning toast/alert fires: "You've reached your monthly budget"
- [ ] When `spent > budget`, the hero total text also switches to danger red
- [ ] Progress bar and label animate in with the existing entrance animation sequence (added as a 6th staggered item)
- [ ] No budget set → progress bar hidden (no empty placeholder shown)
- [ ] Budget resets context each calendar month automatically (no action needed — it's always compared against the current month's spend)
- [ ] New `lib/hooks/use-budget.hook.ts` to encapsulate load/save/compare logic

**Files to touch:** `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`, new `lib/hooks/use-budget.hook.ts`

---

#### 4. Entry search
> **Status:** `[ ] Not started`

**Why:** Pure in-memory filter on the already-loaded entries array — zero backend work.

**Requirements:**
- [ ] Search bar appears at the top of the Browse screen, below the header, above the period pills
- [ ] Input uses `DMSans_400Regular`, placeholder "Search notes…", `theme.inkMuted` placeholder color
- [ ] Filtering is case-insensitive and matches partial substrings against the `note` field
- [ ] Results update on every keystroke (no debounce needed for local data)
- [ ] When search is active, the period selector and date navigator are hidden (search spans all time)
- [ ] Stats grid recalculates based on the filtered result set while search is active
- [ ] A clear (×) button appears inside the input when query is non-empty; tapping it resets the query and restores the period view
- [ ] Empty state for no-match: "No entries match "xyz"" with a subdued message
- [ ] Search state is local to the Browse screen (`useState`) — not persisted, not in context

**Files to touch:** `app/(tabs)/explore.tsx`

---

#### 5. Swipe to delete on entry cards
> **Status:** `[ ] Not started`

**Why:** `react-native-gesture-handler` is already installed. Faster deletion without opening the edit sheet.

**Requirements:**
- [ ] Swipe-left on an entry card in the Browse list reveals a red delete action area on the right side
- [ ] Delete action area shows a trash icon (`HugeIcons`) and the label "Delete" in white on `#e84040` background
- [ ] Action area width: 80 px; card translates left using `react-native-reanimated` + gesture handler
- [ ] Swiping past a threshold (≥ 80 px) auto-completes and triggers deletion; swiping back cancels
- [ ] On auto-complete: entry slides fully off-screen to the right and collapses in height (spring), then `deleteEntry(id)` is called
- [ ] Haptic error feedback fires at the moment of deletion (ties into feature #1)
- [ ] Only one card can be open at a time; opening a new swipe closes any currently open card
- [ ] Home screen "Recent entries" cards are **not** swipeable (edit-only context)
- [ ] Swipe is disabled if the Browse sort is not date-sorted (or remains enabled — team decision, mark clearly in implementation)

**Files to touch:** `lib/components/entry-card.component.tsx` (add swipe variant prop or a new `SwipeableEntryCard` wrapper), `app/(tabs)/explore.tsx`

---

#### 6. Currency / locale formatting setting
> **Status:** `[ ] Not started`

**Why:** Currency symbol and number format are hardcoded as `৳` and EN-style separators throughout.

**Requirements:**
- [ ] New Settings section "Region" with two controls:
  - **Currency symbol** — text input (max 3 chars), default `৳`
  - **Decimal separator** — segmented control: `. (1,234.56)` vs `, (1.234,56)`
- [ ] Settings persisted in AsyncStorage under `poisha_locale` as `{ symbol: string, decimalComma: boolean }`
- [ ] New `lib/utils/format.util.ts` exports:
  - `fmt(n, locale)` — compact format with k-suffix
  - `fmtFull(n, locale)` — full format with separators
- [ ] All existing inline `fmt` / `fmtFull` definitions across `index.tsx`, `explore.tsx`, `settings.tsx`, and `add-entry-sheet.component.tsx` are removed and replaced with imports from `format.util.ts`
- [ ] New `lib/hooks/use-locale.hook.ts` loads locale from AsyncStorage and exposes `{ symbol, fmt, fmtFull }`
- [ ] All screens/components that display amounts call `fmtFull` / `fmt` through this hook
- [ ] Changing the symbol in Settings updates every visible amount immediately (no restart needed)
- [ ] Currency symbol in `AddEntrySheet` amount row prefix updates live as the user types in Settings

**Files to touch:** `app/(tabs)/settings.tsx`, new `lib/utils/format.util.ts`, new `lib/hooks/use-locale.hook.ts`, `app/(tabs)/index.tsx`, `app/(tabs)/explore.tsx`, `lib/components/add-entry-sheet.component.tsx`, `lib/components/entry-card.component.tsx`

---

#### 7. Shake to undo last entry
> **Status:** `[ ] Not started`

**Why:** Satisfying one-tap escape hatch after an accidental save; `expo-sensors` adds the only new dependency.

**Requirements:**
- [ ] Install `expo-sensors` via `npx expo install expo-sensors`
- [ ] Shake is detected using `Accelerometer` — threshold: combined magnitude > 1.8 g for ≥ 3 consecutive samples at 100 ms intervals
- [ ] Shake only triggers if: (a) the app is in the foreground, (b) the entry sheet is closed, and (c) a "last saved entry" exists in memory
- [ ] On shake: a bottom-anchored toast slides up: `"Undo last entry? [Undo]  [Dismiss]"` — auto-dismisses after 5 seconds
- [ ] Tapping "Undo" calls `deleteEntry(lastSavedEntry.id)` and shows a brief success toast "Entry removed"
- [ ] "Last saved entry" reference is held in `EntriesContext` as `lastSaved: Entry | null`; cleared on: app background, any subsequent save, or undo itself
- [ ] Haptic warning feedback fires when the shake is recognized (ties into feature #1)
- [ ] Accelerometer subscription is active only while `lastSaved !== null` (avoids background battery drain)
- [ ] The undo toast is rendered at root layout level (same layer as `AddEntrySheet`) so it appears above all tabs

**Files to touch:** `lib/context/entries.context.tsx` (add `lastSaved`), new `lib/components/undo-toast.component.tsx`, `app/_layout.tsx` (render toast), new `lib/hooks/use-shake.hook.ts`

---

### Medium Features (3–7 days each)

| # | Feature | Why it fits |
|---|---------|-------------|
| 8 | **Recurring entries** | Mark an entry as recurring (daily / weekly / monthly). A background task (expo-background-fetch or a simple check on app launch) creates the entry automatically. Useful for rent, subscriptions, salary. |
| 9 | **Tags / labels** | Add an optional array of free-text tags to an entry (e.g., "food", "transport"). Browse screen gains a tag filter chip row. No rigid categories — lightweight and opt-in. |
| 10 | **Monthly trend line chart** | A 6-month or 12-month rolling line chart on the Home screen below the bar chart, showing how total monthly spend is trending. Plain `View`-based like the existing bar chart. |
| 11 | **Notes with rich quick-picks** | A row of emoji/icon quick-picks above the note keyboard (e.g., 🍔 🚗 🏠 ✈️) that insert a tag into the note field. Zero new dependencies, makes note entry faster. |
| 12 | **Scheduled export** | Auto-export a CSV to Files / iCloud Drive / Google Drive on the 1st of each month. Uses `expo-file-system` + `expo-sharing`, which are already installed. |
| 13 | **iCloud / Google Drive backup** | Manual one-tap backup of the SQLite database (or JSON export) to the user's cloud storage. Provides peace of mind beyond local CSV export. |
| 14 | **Entry amount calculator** | Replace the plain number input in `AddEntrySheet` with a mini calculator that can evaluate `240+50` as a single amount. Useful when splitting bills or computing totals mentally. |

---

### Larger Features (1–2 weeks each)

| # | Feature | Why it fits |
|---|---------|-------------|
| 15 | **Spending insights / summary email** | Weekly or monthly in-app summary card ("You spent ৳12,400 this week, 8% more than last week"). Could also be exported as a formatted PDF or shared image. |
| 16 | **Multiple accounts / wallets** | Let the user track cash, card, and mobile-money separately. A wallet selector in the entry sheet and a per-wallet breakdown on the Home screen. Requires a schema migration (add `walletId` to Entry). |
| 17 | **Push notification reminders** | `expo-notifications` daily reminder: "Don't forget to log today's expenses." Configurable time in Settings. Helps build the habit. |
| 18 | **Attachments / receipt photos** | Attach a photo (camera or gallery) to an entry as a receipt. Stored in `expo-file-system`. Entry card shows a thumbnail. `expo-image` is already installed. |
| 19 | **Data sync / multi-device** | Sync entries across devices via a lightweight backend (Supabase or Firebase). Optional — users who don't sign up use local-only mode. Significant but high retention value. |
| 20 | **Spending streaks & milestones** | Gamified streaks for logging every day, and milestone badges (e.g., "Logged 100 entries"). Purely cosmetic, stored locally — encourages the journaling habit. |

---

### Architecture / DX Improvements

| # | Improvement | Notes |
|---|-------------|-------|
| A | **Centralize currency formatting** | `fmt()` and `fmtFull()` are copy-pasted across screens. Extract to `lib/utils/format.util.ts` so the currency symbol change (suggestion #6) is a one-line fix. |
| B | **Date utilities file** | `toISO`, `formatDateLong`, `formatDate`, and the `new Date(y, m-1, d)` pattern are repeated. Centralizing them prevents bugs. |
| C | **Unit tests for services** | `pin.service.ts` and `csv.util.ts` are pure logic — easy to test with Jest/Bun without mocking native modules. |
| D | **Error boundary** | A top-level React error boundary in `app/_layout.tsx` with a friendly "Something went wrong / restart app" screen instead of a white crash screen. |
