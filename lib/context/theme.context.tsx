import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import { darkTheme, lightTheme, type Palette } from '@/lib/constants/theme';

export type ColorScheme = 'light' | 'dark';

export interface ThemeCtxValue {
  scheme: ColorScheme;
  colors: Palette;
  toggleScheme: () => void;
}

export const ThemeCtx = createContext<ThemeCtxValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<ColorScheme>('dark');

  useEffect(() => {
    AsyncStorage.getItem('poisha_theme').then(v => {
      if (v === 'light' || v === 'dark') setScheme(v);
    });
  }, []);

  const toggleScheme = () => {
    const next: ColorScheme = scheme === 'dark' ? 'light' : 'dark';
    setScheme(next);
    AsyncStorage.setItem('poisha_theme', next);
  };

  const colors = scheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeCtx.Provider value={{ scheme, colors, toggleScheme }}>
      {children}
    </ThemeCtx.Provider>
  );
}
