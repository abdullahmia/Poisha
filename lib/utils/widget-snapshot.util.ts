import { File, Paths } from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { DEFAULT_LOCALE, type Locale } from '@/lib/utils/format.util';
import type { Entry } from '@/lib/types/entry.type';

const APP_GROUP = 'group.com.amia1971.tracker';
const LOCALE_KEY = 'poisha_locale';

type WidgetKit = { reloadAllTimelines?: () => void };

function getSnapshotFile(): File {
  if (Platform.OS === 'ios') {
    const container = Paths.appleSharedContainers[APP_GROUP];
    return new File(container, 'widget_snapshot.json');
  }
  return new File(Paths.document, 'widget_snapshot.json');
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export async function writeWidgetSnapshot(entries: Entry[]): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(LOCALE_KEY);
    const locale: Locale = raw ? { ...DEFAULT_LOCALE, ...(JSON.parse(raw) as Partial<Locale>) } : DEFAULT_LOCALE;

    const today = todayISO();
    const todayTotal = entries
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amounts.reduce((s, a) => s + a, 0), 0);

    getSnapshotFile().write(JSON.stringify({
      todayTotal,
      todayDate: today,
      symbol: locale.symbol,
      updatedAt: Date.now(),
    }));

    if (Platform.OS === 'ios') {
      // Trigger WidgetKit timeline reload when the native module is linked
      ((globalThis as unknown) as Record<string, WidgetKit>)['WidgetKit']?.reloadAllTimelines?.();
    }
  } catch {
    // Best-effort: widget snapshot failures must not interrupt entry mutations
  }
}
