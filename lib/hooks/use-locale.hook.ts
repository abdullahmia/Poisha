import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_LOCALE, fmt as _fmt, fmtFull as _fmtFull, type Locale } from '@/lib/utils/format.util';

const KEY = 'poisha_locale';

// Module-level store — all hook instances share this so changing locale in
// Settings propagates instantly to every component without a Provider.
let _locale: Locale = { ...DEFAULT_LOCALE };
const _listeners = new Set<(v: Locale) => void>();

AsyncStorage.getItem(KEY).then(raw => {
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw) as Partial<Locale>;
    _locale = { ...DEFAULT_LOCALE, ...parsed };
    _listeners.forEach(fn => fn(_locale));
  } catch {}
});

interface UseLocaleReturn {
  locale: Locale;
  setLocale: (l: Partial<Locale>) => Promise<void>;
  fmt: (n: number) => string;
  fmtFull: (n: number) => string;
}

export function useLocale(): UseLocaleReturn {
  const [locale, setLocaleState] = useState<Locale>(_locale);

  useEffect(() => {
    _listeners.add(setLocaleState);
    return () => { _listeners.delete(setLocaleState); };
  }, []);

  const setLocale = useCallback(async (partial: Partial<Locale>) => {
    _locale = { ..._locale, ...partial };
    _listeners.forEach(fn => fn(_locale));
    await AsyncStorage.setItem(KEY, JSON.stringify(_locale));
  }, []);

  const fmt = useCallback((n: number) => _fmt(n, locale), [locale]);
  const fmtFull = useCallback((n: number) => _fmtFull(n, locale), [locale]);

  return { locale, setLocale, fmt, fmtFull };
}
