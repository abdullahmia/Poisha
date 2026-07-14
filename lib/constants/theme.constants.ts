import type { TPalette } from '@/lib/types';

export const DARK_THEME: TPalette = {
  bg: '#0c0c0e',
  surface: '#141416',
  surfaceAlt: '#1e1e22',
  ink: '#f0ece5',
  inkSoft: '#98918a',
  inkMuted: '#524c46',
  accent: '#ff5c35',
  accentSoft: '#221008',
  line: '#242428',
  shadow: '#000000',
  danger: '#e84040',
  dangerSoft: '#2d1414',
} as const;

export const LIGHT_THEME: TPalette = {
  bg: '#ffffff', // pure white page
  surface: '#f5f3f0', // warm off-white cards — subtle lift from white
  surfaceAlt: '#ede9e2', // warm grey-beige for inputs inside cards
  ink: '#1c1512', // deep warm ink
  inkSoft: '#5a4d3c', // warm medium brown
  inkMuted: '#8a7a64', // warm muted for labels/placeholders
  accent: '#c04a22', // brand red
  accentSoft: '#fde8de', // peachy-warm accent background
  line: '#e2ddd6', // soft warm border
  shadow: '#2c1f10', // warm dark brown shadow
  danger: '#e84040',
  dangerSoft: '#fde2de',
} as const;
