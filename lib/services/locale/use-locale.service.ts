import { useQuery } from '@tanstack/react-query';
import { ASYNC_STORAGE_KEYS, DEFAULT_LOCALE, QUERY_KEYS } from '@/lib/constants';
import { storage } from '@/lib/storages';
import type { TLocale } from '@/lib/types';

async function fetchLocale(): Promise<TLocale> {
  const raw = await storage.getItem(ASYNC_STORAGE_KEYS.locale);
  if (!raw) return DEFAULT_LOCALE;
  try {
    return { ...DEFAULT_LOCALE, ...(JSON.parse(raw) as Partial<TLocale>) };
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function useLocale() {
  return useQuery({
    queryKey: QUERY_KEYS.locale,
    queryFn: fetchLocale,
    initialData: DEFAULT_LOCALE,
  });
}
