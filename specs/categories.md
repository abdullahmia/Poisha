# Categories

> **Status:** `[ ] Not started`
> **Effort:** Medium (schema migration + 4 screens touched + a Settings feature-flag toggle gating all of them)

## Why

`TEntry` today is `{ id, date, amounts: number[], note }` (`lib/types/entry.types.ts`) — there is no structured way to know *what* money was spent on beyond a free-text note. As an expense tracker this is the single biggest functional gap: no spend-by-category breakdown, no per-category budget, no category filter in Browse. Categories are also the dependency for several other roadmap ideas (per-category budgets, breakdown charts), so this should land before those.

## Scope decisions for v1

These are decisions, not open questions — made to keep v1 shippable:

1. **One category per entry, not per amount line.** An entry can already hold multiple `amounts` (e.g. splitting a shopping trip into line items), but there's no per-line note today either — note is entry-level. Category follows the same rule: entry-level, not line-level. Splitting one entry across categories is a bigger schema change (`amounts: number[]` → `amounts: {value, categoryId}[]`) and is explicitly out of scope here.
2. **Categories are user-manageable, not hardcoded.** Ship with a seeded default set, but store them in their own SQLite table so users can rename, recolor, add, and delete. A hardcoded enum would block the obvious next request ("let me add my own category").
3. **Icon = emoji string, not an icon-font glyph.** The app uses Feather via `@expo/vector-icons` elsewhere, but Feather's set doesn't cover "food / transport / rent" concepts well, and emoji needs no asset loading, renders identically in light/dark, and matches the app's existing casual tone (`AddEntrySheet` note placeholder is already "groceries, rent, etc."). Store one emoji character per category.
4. **Uncategorized is the default, not a forced choice.** New entries default to no category (`categoryId: null`) rather than forcing a pick before saving — matches the existing low-friction save flow (`canSave` only requires a non-zero amount today, see `lib/hooks/use-entry-form.hook.ts:29`). Uncategorized entries display with a neutral placeholder chip.
5. **Existing entries are not backfilled.** On migration, every existing row gets `category_id = NULL` (Uncategorized). No heuristic note→category guessing in v1.
6. **The whole feature sits behind a single Settings toggle, default off.** "Enable Categories" is a master switch in Settings. Off = the feature behaves as if it doesn't exist anywhere in the app (entry sheet, entry card, Browse filter/breakdown, Settings management row all hidden). On = everything in this spec is active. Default **off** on both fresh installs and existing installs after upgrade, consistent with how every other optional surface in this app is opt-in (budget empty until set, notifications off until granted, locale defaults applied silently) — shipping a brand-new always-visible UI element to existing users without warning is the kind of change this app's settings model deliberately avoids.
7. **The toggle hides UI, it does not delete or block data.** Turning categories off never clears `category_id` off existing entries or touches the `categories` table — it only stops rendering category UI. Turning it back on later restores exactly what was there before. This is unrelated to CSV behavior (below), which ignores category data entirely regardless of the toggle.
8. **CSV import/export ignores categories completely.** The CSV format stays exactly what it is today (`id,date,amounts,note`) — no `category_id` column, ever. Exporting never writes category data, and every imported entry gets `categoryId: null` (Uncategorized) regardless of what it was tagged with before export. This trades away cross-device/backup category continuity for a simpler, unchanged CSV format and zero risk of a malformed or mismatched category reference corrupting an import — acceptable because CSV is positioned in this app as a raw amounts/notes backup, not a full-fidelity data migration tool.

## Feature flag — "Enable Categories" toggle

New `ASYNC_STORAGE_KEYS.categoriesEnabled = 'poisha_categories_enabled'` (`lib/constants/storage-keys.constants.ts`), new `QUERY_KEYS.categories.enabled = ['categories', 'enabled']`. Mirrors the existing notifications-enabled pattern exactly (`lib/services/notifications/use-notifications-enabled.service.ts` / `use-set-notifications-enabled.service.ts`):

- `lib/services/categories/use-categories-enabled.service.ts` — `useQuery`, reads the stored `'true'`/`'false'` string, **`initialData: false`**.
- `lib/services/categories/use-set-categories-enabled.service.ts` — `useMutation`, writes the string, updates the query cache on success. No permission request needed (unlike notifications), so this one is simpler than its notifications counterpart.
- `use-categories.hook.ts` (below) exposes `{ enabled, setEnabled, ... }` from these two services alongside the categories list/CRUD, so every consumer only needs to import one hook.

Every component that renders category UI reads `enabled` from `useCategories()` and either skips its category-specific rendering or (for the two screens that are *entirely* about categories — the Browse breakdown card and the Settings management sheet) doesn't mount at all. This is called out per-component below rather than centralized into one wrapper, because each site hides a different amount of surrounding UI (see each section).

## Data model

### New type — `lib/types/category.types.ts`

```ts
export interface TCategory {
  id: string;       // slug, e.g. "food"
  name: string;      // "Food"
  icon: string;       // "🍔" (single emoji)
  color: string;      // hex, e.g. "#e8734a" — used for chips/chart segments
  sortOrder: number;
  archived: boolean;   // soft-delete: hidden from pickers, kept for historical entries
}
```

Add to `lib/types/index.ts` export barrel and to `lib/types/entry.types.ts`:

```ts
export interface TEntry {
  id: string;
  date: string;
  amounts: number[];
  note: string;
  categoryId: string | null; // null = Uncategorized
}
```

### Default seed set (id / name / icon / color)

| id | name | icon | color |
|---|---|---|---|
| `food` | Food | 🍔 | `#e8734a` |
| `transport` | Transport | 🚗 | `#4a90c0` |
| `housing` | Housing | 🏠 | `#8a6bc0` |
| `bills` | Bills | 💡 | `#c0a34a` |
| `shopping` | Shopping | 🛍️ | `#c04a8a` |
| `health` | Health | 💊 | `#4ac07a` |
| `entertainment` | Entertainment | 🎬 | `#c05a4a` |
| `other` | Other | 📦 | `#8a8a8a` |

Seeded once on first launch (same pattern as the existing seed-data injection mentioned for entries) and whenever the `categories` table is created fresh. Colors are distinct from `theme.accent`/`theme.danger` in both palettes (`lib/constants/theme.constants.ts`) so category chips don't visually collide with accent-colored UI (multi-amount stripe, danger actions).

## Storage layer — `lib/storages/sqlite.storage.ts`

Current class only does `CREATE TABLE IF NOT EXISTS` with no `ALTER TABLE` precedent — this is the first schema migration the app has needed since SQLite adoption.

1. **New table:**
```sql
CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  color      TEXT NOT NULL,
  sortOrder  INTEGER NOT NULL DEFAULT 0,
  archived   INTEGER NOT NULL DEFAULT 0
);
```
2. **Column addition on `entries`**, guarded because `expo-sqlite`'s `execSync` throws on a duplicate column and there's no `ADD COLUMN IF NOT EXISTS`:
```ts
private migrateAddCategoryColumn(): void {
  try {
    this.db.execSync('ALTER TABLE entries ADD COLUMN category_id TEXT');
  } catch {
    // column already exists — no-op
  }
}
```
Call this from the constructor right after `createTable()`, same place `createTable` runs today.

3. **Seed categories** if the table is empty (mirrors the existing `isEmpty()` + seed-data pattern used for entries):
```ts
seedCategoriesIfEmpty(defaults: TCategory[]): void { ... }
```

4. **New methods** on `SqliteStorage`:
- `loadCategories(): TCategory[]` — `SELECT * FROM categories WHERE archived = 0 ORDER BY sortOrder ASC` (management screen needs archived ones too — add `loadAllCategories()` or a param)
- `upsertCategory(category: TCategory): void`
- `archiveCategory(id: string): void` — sets `archived = 1`, does **not** delete the row (historical entries still need to resolve `category_id` → name/icon/color for past months)
- `reorderCategories(ids: string[]): void` — batch-update `sortOrder`
- Update `loadEntries()` to select `category_id` and map it to `categoryId` in the returned `TEntry`
- Update `upsertEntry()` to write `category_id`

## Query keys — `lib/constants/query-keys.constants.ts`

Add:
```ts
categories: { all: ['categories'], enabled: ['categories', 'enabled'] },
```

## Services — new `lib/services/categories/`

Follow the existing `lib/services/entries/` pattern (one file per operation, barrel `index.ts`):
- `use-categories.service.ts` — `useQuery` over `sqliteStorage.loadCategories()`
- `use-save-category.service.ts` — upsert mutation, invalidates `QUERY_KEYS.categories.all`
- `use-archive-category.service.ts` — archive mutation; **must also** reassign or leave entries pointing at the archived id alone (they keep displaying the archived category's icon/color/name until changed — do not null them out, that would silently erase user-visible history)
- `use-reorder-categories.service.ts`
- `use-categories-enabled.service.ts` / `use-set-categories-enabled.service.ts` — the feature-flag read/write pair described above

Update existing entry services to carry `categoryId`:
- `use-save-entry.service.ts` — `TDraft` gains `categoryId: string | null`, passed straight through to `sqliteStorage.upsertEntry`
- `use-import-entries.service.ts` — **no change needed.** `csvToEntries` already returns fully-formed `TEntry` objects with `categoryId: null` hardcoded in (see CSV section), so the rows this service passes to `sqliteStorage.upsertEntry` satisfy the type with no extra mapping step.

## Hooks

- **New `lib/hooks/use-categories.hook.ts`** — wraps the categories query + save/archive/reorder mutations *and* the feature-flag pair, exposes `{ categories, saveCategory, archiveCategory, reorderCategories, enabled, setEnabled }`. Mirrors `use-budget.hook.ts`'s shape. `categories` should be returned as `[]` when `enabled` is false — consumers that map over `categories` (chip rows, breakdown) then naturally render nothing without needing a separate check, though the two full-screen cases (Browse breakdown card, Settings management row) still check `enabled` directly to decide whether to mount at all rather than mount-and-render-empty.
- **New `lib/hooks/use-category-breakdown.hook.ts`** — given an entry list, group by `categoryId`, sum totals, sort descending, resolve id → `TCategory` (fallback to a synthetic "Uncategorized" pseudo-category `{ id: null, name: 'Uncategorized', icon: '❔', color: theme.inkMuted }` for unassigned entries). Used by both the Browse breakdown card and (later) Home.
- **Update `lib/hooks/use-entry-form.hook.ts`**:
  - `entryFormSchema` (`lib/schemas/entry.schemas.ts`) gains `categoryId: z.string().nullable()`
  - form default: `entry?.categoryId ?? null`
  - `handleSave` passes `categoryId` into the draft
- **Update `lib/hooks/use-entries-list.hook.ts`** (Browse) — add `categoryFilter: string | null` state alongside existing `period`/`sort`, applied in the `filtered` memo before the sort step; reset to `null` when period changes (existing `handlePeriodChange` resets `offset`, extend it).

## UI changes

### `lib/components/entries/add-entry-sheet.component.tsx`
Insert a category picker between **Amounts** and **Note** (same section pattern: uppercase label + content block) — **only when `enabled` is true**, read via `useCategories()`. When `enabled` is false the entire block is omitted from the tree (`{enabled && <View>...category picker...</View>}`), not just visually collapsed, so a disabled feature costs nothing and the sheet's layout matches today's exactly (Amounts directly followed by Note). Horizontal scrollable row of chips (`emoji + name`, `theme.accentSoft`-style background when selected, matching the existing chip/pill visual language used by `period-selector.component.tsx`). Tapping a chip toggles `categoryId`; tapping the already-selected chip clears it back to Uncategorized. No modal/sheet-in-sheet — keep it inline to avoid the nested-modal touch-bleed bug already logged as BUG-002.

Note: `categoryId` is still saved on the draft even while the picker UI is hidden (it simply stays whatever it already was — `null` for a new entry, unchanged for an edit) — hiding the picker must not force-null an existing category on an entry that's edited while the toggle happens to be off.

### `lib/components/entries/entry-card.component.tsx`
When `enabled` is true and the entry has a `categoryId`: show its emoji in place of (or beside) the day number, and use `category.color` for the left accent stripe instead of the hardcoded `bg-accent` (currently only shown for multi-amount entries — category color takes precedence when present). Subtitle line (`entry.note || '—'`) becomes `category.name` when no note, falling back to current behavior when uncategorized. When `enabled` is false, the card renders exactly as it does today regardless of whether the underlying entry has a stored `categoryId` — the data is preserved but not surfaced.

### `lib/components/explore/` (Browse screen)
- New `category-filter-chips.component.tsx` — horizontal chip row below `period-selector.component.tsx`, "All" + one chip per non-archived category (+ "Uncategorized"). Selecting one filters the list via the new `categoryFilter` hook state. **Entire component is skipped (not rendered) when `enabled` is false** — no "All" chip with nothing else to select.
- New `category-breakdown.component.tsx` — a card (reuse `Card` from `lib/ui/card.ui.tsx`) listing top categories for the current filtered range: icon, name, total, percentage bar in `category.color`. Placed between `StatsGrid` and the entries list. Uses `use-category-breakdown.hook.ts` fed by `filtered` from `use-entries-list.hook.ts`. **Also skipped entirely when `enabled` is false.**
- `explore.tsx` wires both behind a single `const { enabled } = useCategories();` check rather than each component re-deriving it, so the two mounts/unmounts are obviously paired when reading the screen.

### Settings — "Categories" section with a master toggle
- New `lib/components/settings/categories-section.component.tsx` — **always visible** in Settings (unlike the rows it controls). Renders as a `Card` with:
  1. A toggle row — `Switch` component, same pattern as `AppearanceSection`'s Theme/Haptics rows (`lib/components/settings/appearance-section.component.tsx`): icon, "Enable Categories" label, sub-label "On"/"Off", bound to `enabled`/`setEnabled` from `useCategories()`.
  2. A second row, **only rendered when `enabled` is true** — "Manage Categories" with a chevron, opening the `categories-sheet` `BottomSheet` (same pattern as `budget-sheet.component.tsx` / `csv-format-sheet.component.tsx`). This row (and its divider) simply isn't in the tree when the toggle is off — there's nothing to manage if the feature is off.
- New `lib/components/settings/categories-sheet.component.tsx` — list of categories (drag-to-reorder or simple up/down arrows — match effort of existing UI, no new gesture dependency needed if up/down arrows are acceptable), each row: emoji, name, color swatch, edit (opens inline add/edit form: name text input, emoji text input capped at 1 grapheme, color swatch picker from a fixed palette of ~12 swatches — no color-wheel picker, keep it simple), archive (with `ConfirmModal`, same destructive pattern as "Reset All Data" in `data-section.component.tsx`).
- Archiving a category that has entries: confirmation copy should say entries keep their category for history but it disappears from new-entry pickers — not "entries will be uncategorized" (that would be false per the storage decision above).
- Turning the master toggle **off** while the "Manage Categories" sheet happens to be open: close the sheet immediately (`enabled` flipping to `false` should drive the sheet's `visible` prop, not just hide the row that opens it) — otherwise the user is left inside a management UI for a feature that just declared itself off everywhere else.

## CSV import / export — `lib/utils/csv.util.ts`

Categories are **fully out of scope** for this file. No column, no header change, no format-version bump.

- `entriesToCsv` is **unmodified** — it already only serializes `id, date, amounts, note` and simply keeps ignoring `categoryId`, same as it ignores nothing else today because there was nothing else. A category-tagged entry exports identically to an untagged one.
- `csvToEntries` needs exactly one change: every returned entry must include `categoryId: null` explicitly, because `TEntry` now requires the field (`lib/types/entry.types.ts`) and the parsed CSV row has no source for it:
  ```ts
  entries.push({ id, date, amounts, note: note ?? '', categoryId: null });
  ```
  This is the only edit this file needs — it's satisfying the type, not implementing an import feature.
- No "unknown category id" handling is needed, because the field is never read from the file in the first place — there's nothing to validate or fall back on.
- Add a line to `csv-format-sheet.component.tsx`'s existing format-explainer copy noting that categories aren't included in export/import, so a user who re-imports a previously-exported file isn't surprised to find every entry back to Uncategorized.

## Migration / rollout plan

1. **Phase 1 — data model + capture + the toggle itself.** SQLite migration (categories table + `category_id` column), seed defaults, `TEntry`/`TCategory` types, the feature-flag key/service/hook, the Settings toggle row (`categories-section.component.tsx`, toggle-only — no "Manage Categories" row yet), `AddEntrySheet` category picker, `EntryCard` display. The toggle has to ship in this phase, not later, because it's the only way a user can ever turn the feature on — Phase 1 is incomplete without it even though "manage custom categories" is Phase 3. Ships a fully working "flip it on, tag new entries with the 8 seeded categories" experience, default off. Existing entries show as Uncategorized.
2. **Phase 2 — Browse.** Category filter chips + breakdown card in Browse, both gated on the same `enabled` flag from Phase 1. This is where categories start paying off (answering "how much did I spend on food this month").
3. **Phase 3 — Settings management.** The "Manage Categories" row + sheet, appearing under the toggle once it's on — add/edit/archive/reorder custom categories. Until this ships, enabling the toggle gets users the seeded 8 with no ability to customize — acceptable as an interim state since Phase 1+2 are fully useful without it.
4. **Phase 4 — stretch, separate spec later.** Per-category budgets (extends existing `use-budget.hook.ts` / `BudgetBar` pattern from a single global number to a map), Home-screen top-category stat, category quick-pick on the note field replacing the old "emoji quick-pick" roadmap idea (superseded by real categories).

Ship phases independently — each is a complete, mergeable unit; don't block Phase 1 on Phase 3 design.

## Edge cases to handle explicitly

- Deleting/archiving the *last* remaining category — must still leave "Uncategorized" as a selectable state (it's implicit `null`, not a row, so this is naturally fine).
- Renaming a category updates every past entry's displayed name for free (id-based reference, no denormalization) — this is intended, not a bug.
- Two categories with the same color — allowed, no uniqueness constraint; breakdown UI should still distinguish via icon+name even if colors visually clash.
- Emoji input on Android keyboards that don't default to emoji panel — the name field is the primary identifier; icon has a fallback rendering (first letter of name) if the stored string isn't a valid emoji grapheme.
- **CSV round-trip loses category assignment, by design.** Exporting then re-importing the same data resets every entry to Uncategorized — this is the direct consequence of the "CSV ignores categories completely" decision above, not a bug to fix. There's currently no other cross-device sync mechanism in the app, so this is a known limitation worth surfacing in the format-explainer copy rather than solving here.
- **Toggling off and back on** — must be fully non-destructive: `categories` table rows and every entry's `category_id` are untouched by the flag, so re-enabling instantly restores the exact prior state (same categories, same tags on entries, same sort order). The flag write is a single AsyncStorage boolean, nothing else.
- **Toggling off while the Browse category filter is active** — `categoryFilter` state in `use-entries-list.hook.ts` should reset to `null` when `enabled` flips to false, so that re-enabling later doesn't resume with a filter silently applied that the (now-hidden, then re-shown) chip row never visibly indicated.

## Files touched (summary)

**New:**
`lib/types/category.types.ts`, `lib/services/categories/*` (including `use-categories-enabled.service.ts` / `use-set-categories-enabled.service.ts`), `lib/hooks/use-categories.hook.ts`, `lib/hooks/use-category-breakdown.hook.ts`, `lib/components/explore/category-filter-chips.component.tsx`, `lib/components/explore/category-breakdown.component.tsx`, `lib/components/settings/categories-section.component.tsx`, `lib/components/settings/categories-sheet.component.tsx`

**Modified:**
`lib/types/entry.types.ts`, `lib/types/index.ts`, `lib/schemas/entry.schemas.ts`, `lib/storages/sqlite.storage.ts`, `lib/constants/query-keys.constants.ts`, `lib/constants/storage-keys.constants.ts` (add `categoriesEnabled`), `lib/services/entries/use-save-entry.service.ts`, `lib/hooks/use-entry-form.hook.ts`, `lib/hooks/use-entries-list.hook.ts` (category filter + reset-on-disable), `lib/components/entries/add-entry-sheet.component.tsx`, `lib/components/entries/entry-card.component.tsx`, `lib/utils/csv.util.ts` (hardcode `categoryId: null` on parsed rows only — no format change), `lib/components/settings/csv-format-sheet.component.tsx` (note that categories aren't exported/imported), `app/(tabs)/settings.tsx` (mount new section)

`use-import-entries.service.ts` is deliberately **not** in this list — it needs no change (see Services section).

## Genuinely open questions

1. **Reorder UX in the categories sheet** — simple up/down arrow buttons (zero new deps) vs. drag handles (`react-native-gesture-handler` is already installed so this is cheap, but adds interaction complexity). Recommend starting with up/down arrows.
2. **Color picker** — fixed swatch palette (~12 options, simplest) vs. a full HSB picker (more native-app-store-ready but a new dependency). Recommend the fixed swatch palette for v1.
