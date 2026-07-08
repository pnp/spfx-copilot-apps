import { tokens } from '@fluentui/react-components';

/**
 * Resolve a Fluent token *name* (stored in mock data) to its CSS variable value
 * so it can be used directly as an SVG `fill` / `stroke`.
 *
 * Keeping this mapping explicit avoids indexing the `tokens` object with an
 * arbitrary string and keeps the palette curated for the charts.
 */
const PALETTE: Record<string, string> = {
  colorBrandBackground: tokens.colorBrandBackground,
  colorPaletteTealBackground2: tokens.colorPaletteTealBackground2,
  colorPalettePurpleBackground2: tokens.colorPalettePurpleBackground2,
  colorNeutralStroke1: tokens.colorNeutralStroke1
};

export function resolveTokenColor(name: string): string {
  return PALETTE[name] ?? tokens.colorBrandBackground;
}
