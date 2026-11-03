import type { TPalette } from '@/lib/types';

/** '#0c0c0e' → '12 12 14' — the space-separated channel form Tailwind's
 *  `rgb(var(--color-x) / <alpha-value>)` colors expect. */
function toRgbChannels(hex: string): string {
  const value = parseInt(hex.slice(1), 16);
  return `${(value >> 16) & 255} ${(value >> 8) & 255} ${value & 255}`;
}

/**
 * A palette as NativeWind CSS variables.
 *
 * Derived from the palette rather than written out, so the variables can never
 * drift from the constants below — the two used to be maintained separately
 * (here and in `global.css`) with nothing keeping them in step.
 *
 * Key names follow the `--color-<kebab-case-palette-key>` convention the
 * Tailwind config reads, so adding a key to `TPalette` is enough to publish it.
 */
export function paletteToCssVars(palette: TPalette): Record<string, string> {
  return Object.fromEntries(
    Object.entries(palette).map(([key, hex]) => [
      `--color-${key.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}`,
      toRgbChannels(hex),
    ]),
  );
}

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

export const DARK_THEME_VARS = paletteToCssVars(DARK_THEME);
export const LIGHT_THEME_VARS = paletteToCssVars(LIGHT_THEME);
