# Feature: "Today at a Glance" Home Screen Widget

## Status

> **Not started**

---

## Overview

A small home-screen widget (iOS Lock Screen / Home Screen, Android App Widget) that shows today's total spend without opening the app. The widget reads from a lightweight JSON snapshot file written by the app on every save/delete, so it does not need to launch the React Native runtime.

---

## Scope

- Widget displays: today's date, today's total spend, app name
- Widget updates whenever the main app saves or deletes an entry
- iOS: WidgetKit extension (Swift) reading a shared App Group file
- Android: Glance / AppWidget reading a shared JSON file from the app's data directory
- Tapping the widget deep-links to the app's Home tab
- Graceful fallback: widget shows "৳ 0 today" when no entries exist for today
- Out of scope: interactive widget actions, multiple widget sizes beyond small, real-time sync without opening the app

---

## Packages

```bash
npx expo install expo-build-properties
```

Third-party widget libraries (choose one based on Expo SDK support at build time):

| Option | Notes |
|---|---|
| `react-native-widget-extension` | Community library, works with Expo managed workflow via config plugin |
| `expo-community-flipper` + bare workflow | If ejecting, use native WidgetKit directly |

> The exact library should be confirmed at implementation time based on Expo 54 compatibility. The snapshot file approach below is library-agnostic.

---

## Shared Snapshot File

The widget cannot access AsyncStorage or SQLite directly. Instead, the main app writes a small JSON snapshot on every entry save/delete.

### Snapshot schema

```ts
interface WidgetSnapshot {
  todayTotal: number;      // sum of all amounts for today's date
  todayDate: string;       // 'YYYY-MM-DD'
  symbol: string;          // currency symbol from locale setting
  updatedAt: number;       // Unix timestamp ms
}
```

### Snapshot file path

**iOS (App Group container):**
```ts
import * as FileSystem from 'expo-file-system';

// App Group ID must match the one configured in Xcode entitlements
const APP_GROUP = 'group.com.amia1971.tracker';
const snapshotPath = `${FileSystem.documentDirectory}../AppGroup/${APP_GROUP}/widget_snapshot.json`;
```

**Android:**
```ts
const snapshotPath = `${FileSystem.documentDirectory}widget_snapshot.json`;
```

> On iOS the file must be in a shared App Group container so the widget extension can read it. On Android, widgets in the same app package can read the app's document directory directly.

### Snapshot utility

**File:** `lib/utils/widget-snapshot.util.ts`

```ts
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export async function writeWidgetSnapshot(
  entries: Entry[],
  symbol: string = '৳'
): Promise<void> {
  const today = toISO(new Date()); // reuse existing toISO util
  const todayEntries = entries.filter(e => e.date === today);
  const todayTotal = todayEntries.reduce(
    (sum, e) => sum + e.amounts.reduce((s, a) => s + a, 0), 0
  );

  const snapshot: WidgetSnapshot = {
    todayTotal,
    todayDate: today,
    symbol,
    updatedAt: Date.now(),
  };

  const path = getSnapshotPath(); // platform-specific path above
  await FileSystem.writeAsStringAsync(path, JSON.stringify(snapshot));

  if (Platform.OS === 'ios') {
    // Trigger WidgetKit timeline reload
    // Requires native module from the widget library
    WidgetKit?.reloadAllTimelines?.();
  }
}
```

### When to write the snapshot

Call `writeWidgetSnapshot(entries, locale.symbol)` inside `EntriesContext` after every:
- `saveEntry` resolves
- `deleteEntry` resolves
- `importEntries` resolves

**File:** `lib/context/entries.context.tsx`

---

## iOS Widget (Swift / WidgetKit)

**Extension target:** `tracker Widget` (add via Xcode → File → New Target → Widget Extension)

### Widget entry

```swift
struct WidgetEntry: TimelineEntry {
    let date: Date
    let todayTotal: Double
    let todayDate: String
    let symbol: String
}
```

### Timeline provider

```swift
struct Provider: TimelineProvider {
    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        completion(readSnapshot())
    }
    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        let entry = readSnapshot()
        // Refresh at midnight to reset "today"
        let midnight = Calendar.current.startOfDay(for: Date().addingTimeInterval(86400))
        completion(Timeline(entries: [entry], policy: .after(midnight)))
    }
    private func readSnapshot() -> WidgetEntry {
        guard
            let containerURL = FileManager.default.containerURL(
                forSecurityApplicationGroupIdentifier: "group.com.amia1971.tracker"),
            let data = try? Data(contentsOf: containerURL.appendingPathComponent("widget_snapshot.json")),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return WidgetEntry(date: Date(), todayTotal: 0, todayDate: "", symbol: "৳")
        }
        return WidgetEntry(
            date: Date(),
            todayTotal: json["todayTotal"] as? Double ?? 0,
            todayDate: json["todayDate"] as? String ?? "",
            symbol: json["symbol"] as? String ?? "৳"
        )
    }
}
```

### Widget view (small size only)

```swift
struct WidgetView: View {
    var entry: WidgetEntry
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Today")
                .font(.system(size: 11, weight: .medium))
                .foregroundColor(.gray)
            Text("\(entry.symbol)\(formatted(entry.todayTotal))")
                .font(.system(size: 24, weight: .semibold))
                .foregroundColor(.primary)
            Spacer()
            Text("Poisha")
                .font(.system(size: 10))
                .foregroundColor(.gray)
        }
        .padding(14)
        .widgetURL(URL(string: "poisha://home"))
    }
}
```

### Deep link handling

**File:** `app/_layout.tsx` (or `app/index.tsx`)

```ts
import * as Linking from 'expo-linking';

const url = Linking.useURL();
useEffect(() => {
  if (url === 'poisha://home') {
    // navigate to Home tab — router.replace('/(tabs)/')
  }
}, [url]);
```

Register the `poisha://` scheme in `app.json`:

```json
"scheme": "poisha"
```

---

## Android Widget (Jetpack Glance)

> Android implementation uses Jetpack Glance (Kotlin). Add a Glance AppWidget receiver that reads `widget_snapshot.json` from the app's files directory and renders a `GlanceAppWidget`.

This is a separate Kotlin file added to the Android native module directory. Implementation detail is deferred to the Android developer; the JS side only needs `writeWidgetSnapshot` to write the file (same utility as iOS).

---

## App Group Configuration (iOS only)

1. In Xcode, enable the App Groups capability on both the main app target and the widget extension target.
2. Use the same group ID: `group.com.amia1971.tracker`.
3. Add the entitlement to `app.json` using `expo-build-properties` or a custom config plugin.

---

## File Checklist

```
lib/
  utils/
    widget-snapshot.util.ts          # new — writeWidgetSnapshot()
  context/
    entries.context.tsx              # call writeWidgetSnapshot after save/delete/import

app/
  _layout.tsx                        # deep link handler for poisha://home

ios/
  trackerWidget/                     # new Xcode widget extension target
    WidgetProvider.swift
    WidgetView.swift

android/
  app/src/main/java/.../
    PoishaWidget.kt                  # new Glance AppWidget
```

---

## Acceptance Criteria

1. After installing the app, the small widget is available in the iOS/Android widget picker.
2. Widget shows "৳ 0 today" (or the user's configured symbol) when no entries exist for today.
3. After saving an entry for today in the app, the widget updates to show the correct total within a few seconds (iOS WidgetKit timeline reload).
4. Widget updates after deleting a today entry.
5. Tapping the widget opens the app on the Home tab.
6. Widget displays correctly in both light and dark system modes.
7. Widget does not crash or show an error state if the snapshot file is missing.
8. `npx tsc --noEmit` passes with no errors.
