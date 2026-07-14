import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, DEFAULT_LOCALE, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TLocale } from '@/lib/types';

export function useSetLocale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (partial: Partial<TLocale>) => {
      const current = queryClient.getQueryData<TLocale>(QUERY_KEYS.locale) ?? DEFAULT_LOCALE;
      const next: TLocale = { ...current, ...partial };
      await storage.setItem(ASYNC_STORAGE_KEYS.locale, JSON.stringify(next));
      return next;
    },
    onSuccess: next => queryClient.setQueryData(QUERY_KEYS.locale, next),
  });
}
