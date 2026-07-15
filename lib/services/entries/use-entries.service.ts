import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import { useQuery } from '@tanstack/react-query';
import { migrateLegacyEntries } from './migrate-legacy-entries';

export function useEntries() {
  return useQuery({
    queryKey: QUERY_KEYS.entries.all,
    queryFn: async () => {
      await migrateLegacyEntries();
      return sqliteStorage.loadEntries();
    },
  });
}
