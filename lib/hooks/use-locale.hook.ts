import { DEFAULT_LOCALE } from "@/lib/constants";
import {
  useLocale as useLocaleQuery,
  useSetLocale,
} from "@/lib/services/locale";
import type { TLocale } from "@/lib/types";
import { fmt as _fmt, fmtFull as _fmtFull } from "@/lib/utils/format.util";
import { useCallback } from "react";

export function useLocale() {
  const { data } = useLocaleQuery();
  const locale = data ?? DEFAULT_LOCALE;
  const setLocaleMutation = useSetLocale();

  const setLocale = useCallback(
    async (partial: Partial<TLocale>) => {
      await setLocaleMutation.mutateAsync(partial);
    },
    [setLocaleMutation],
  );

  const fmt = useCallback((n: number) => _fmt(n, locale), [locale]);
  const fmtFull = useCallback((n: number) => _fmtFull(n, locale), [locale]);

  return { locale, setLocale, fmt, fmtFull };
}
