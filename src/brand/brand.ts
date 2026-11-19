import teamBrand from '../../presets/brand.json';
import teamPresets from '../../presets/presets.json';
import { normalizeHex } from '@/engine/color';
import { FONTS } from '@/engine/fonts';
import { FORMATS, type FormatId } from '@/engine/formats';
import { clamp } from '@/engine/math';
import type { TextCase } from '@/engine/types';

export const BRAND_SCHEMA_VERSION = 2;
export const TEXT_CASES: readonly TextCase[] = ['normal', 'upper', 'lower', 'title'];

export interface BrandKit {
  schemaVersion: number;
  name: string;
  accent: string;
  /** Accent choices offered in the editor (first = brand accent). */
  palette: string[];
  textColor: string;
  titleFontId: string;
  /** PNG/SVG/JPEG/WebP as a data: URL, or null for no logo. */
  logoDataUrl: string | null;
}

/** Team presets: format and readability settings applied to new creations. */
export interface TeamPreset {
  id: string;
  name: string;
  description: string;
  format: FormatId;
  textCase: TextCase;
  veil: number;
  vignette: boolean;
}

/** Turns unknown JSON (a file, localStorage) into a valid kit, falling back field by field. */
export function parseBrandKit(input: unknown, fallback: BrandKit = TEAM_BRAND): BrandKit {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const hex = (v: unknown) => (typeof v === 'string' ? normalizeHex(v) : null);
  const palette = Array.isArray(o.palette) ? o.palette.map(hex).filter((c): c is string => !!c) : [];
  return {
    schemaVersion: BRAND_SCHEMA_VERSION,
    name: typeof o.name === 'string' && o.name.trim() ? o.name.trim().slice(0, 60) : fallback.name,
    accent: hex(o.accent) ?? fallback.accent,
    palette: palette.length ? palette.slice(0, 8) : fallback.palette,
    textColor: hex(o.textColor) ?? fallback.textColor,
    titleFontId:
      typeof o.titleFontId === 'string' && FONTS.some((f) => f.id === o.titleFontId)
        ? o.titleFontId
        : fallback.titleFontId,
    logoDataUrl:
      typeof o.logoDataUrl === 'string' && o.logoDataUrl.startsWith('data:image/') ? o.logoDataUrl : null,
  };
}

const HARD_DEFAULT: BrandKit = {
  schemaVersion: BRAND_SCHEMA_VERSION,
  name: 'Mon équipe',
  accent: '#ec4899',
  palette: ['#ec4899', '#ffffff'],
  textColor: '#ffffff',
  titleFontId: 'inter',
  logoDataUrl: null,
};

/** The kit shipped in presets/brand.json: what everyone gets by default. */
export const TEAM_BRAND: BrandKit = parseBrandKit(teamBrand, HARD_DEFAULT);

export const TEAM_PRESETS: TeamPreset[] = (teamPresets as unknown[]).flatMap((raw) => {
  const p = raw as Partial<TeamPreset>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string' || !FORMATS.some((f) => f.id === p.format))
    return [];
  return [
    {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      format: p.format as FormatId,
      textCase: TEXT_CASES.includes(p.textCase as TextCase) ? (p.textCase as TextCase) : 'normal',
      veil: clamp(typeof p.veil === 'number' ? p.veil : 0, 0, 0.85),
      vignette: p.vignette === true,
    },
  ];
});

/** Palette with the brand accent always first and no duplicates. */
export function brandPalette(kit: BrandKit): string[] {
  return [...new Set([kit.accent, ...kit.palette])];
}
