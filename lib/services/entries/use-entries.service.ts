import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import { migrateLegacyEntries } from './migrate-legacy-entries';

async function fetchEntries() {
  // Runs the one-time legacy-AsyncStorage migration before the first read so
  // any pre-SQLite data is folded in before entries are ever rendered.
  await migrateLegacyEntries();
  return sqliteStorage.loadEntries();
}

export function useEntries() {
  return useQuery({ queryKey: QUERY_KEYS.entries.all, queryFn: fetchEntries });
}
