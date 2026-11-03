import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/lib/constants';
import { sqliteStorage } from '@/lib/storages';
import type { TTodo } from '@/lib/types';
import { carryOverOverdueTodos } from '@/lib/utils/todo-carry-over.util';

export function useTodos() {
  return useQuery({
    queryKey: QUERY_KEYS.todo.all,
    queryFn: async (): Promise<TTodo[]> => {
      // Runs before the read, the same shape as useEntries' legacy migration:
      // it is internally stamped to once a day, so refetches are a no-op, and
      // reading after it means the first render already shows the rolled dates.
      await carryOverOverdueTodos();
      return sqliteStorage.loadTodos();
    },
  });
}
