export interface FontDefinition {
  id: string;
  label: string;
  family: string;
  stack: string;
  /** Bebas Neue is drawn larger to match the visual size of the others. */
  sizeBoost: number;
}

/** Fonts of the original Motion Studio. Files are bundled with the site (@fontsource), see src/main.tsx. */
export const FONTS: readonly FontDefinition[] = [
  {
    id: 'inter',
    label: 'Inter (moderne)',
    family: 'Inter',
    stack: '"Inter", system-ui, sans-serif',
    sizeBoost: 1,
  },
  {
    id: 'montserrat',
    label: 'Montserrat (géométrique)',
    family: 'Montserrat',
    stack: '"Montserrat", "Inter", sans-serif',
    sizeBoost: 1,
  },
  {
    id: 'playfair',
    label: 'Playfair Display (éditorial)',
    family: 'Playfair Display',
    stack: '"Playfair Display", Georgia, serif',
    sizeBoost: 1,
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk (tech)',
    family: 'Space Grotesk',
    stack: '"Space Grotesk", "Inter", sans-serif',
    sizeBoost: 1,
  },
  {
    id: 'bebas-neue',
    label: 'Bebas Neue (cinéma)',
    family: 'Bebas Neue',
    stack: '"Bebas Neue", Impact, sans-serif',
    sizeBoost: 1.18,
  },
  { id: 'syne', label: 'Syne (créatif)', family: 'Syne', stack: '"Syne", "Inter", sans-serif', sizeBoost: 1 },
];

/** Inter is used for labels, roles and small caps whatever the title font. */
export const INTER = FONTS[0] as FontDefinition;

export function getFont(id: string): FontDefinition {
  return FONTS.find((f) => f.id === id) ?? INTER;
}

export function cssFont(font: FontDefinition, weight: number, sizePx: number): string {
  return `${weight} ${Math.max(1, Math.round(sizePx))}px ${font.stack}`;
}

/** Waits until every font the renderer uses is ready, so no frame is drawn with a fallback. */
export async function ensureFontsLoaded(): Promise<void> {
  if (typeof document === 'undefined' || !document.fonts) return;
  const specs = FONTS.flatMap((f) => [500, 700, 800, 900].map((w) => cssFont(f, w, 40)));
  await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => [])));
}
