/** The resolved scheme actually painted on screen. */
export type TColorScheme = 'light' | 'dark';

/** What the user picked. `system` resolves to TColorScheme at render time. */
export type TThemePreference = TColorScheme | 'system';

export interface TPalette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  accent: string;
  accentSoft: string;
  line: string;
  shadow: string;
  danger: string;
  dangerSoft: string;
}
