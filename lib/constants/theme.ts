export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  inkMuted: string;
  accent: string;
  accentSoft: string;
  line: string;
}

export const darkTheme: Palette = {
  bg:         '#0c0c0e',
  surface:    '#141416',
  surfaceAlt: '#1e1e22',
  ink:        '#f0ece5',
  inkSoft:    '#98918a',
  inkMuted:   '#524c46',
  accent:     '#ff5c35',
  accentSoft: '#221008',
  line:       '#242428',
} as const;

export const lightTheme: Palette = {
  bg:         '#efe8d8',
  surface:    '#fbf6ea',
  surfaceAlt: '#e5dbc4',
  ink:        '#1d1712',
  inkSoft:    '#6b5d4a',
  inkMuted:   '#9c8c72',
  accent:     '#b8441f',
  accentSoft: '#e8cfbf',
  line:       '#d8cdb3',
} as const;

// backwards-compatible alias
export const poisha = darkTheme;
