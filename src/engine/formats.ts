export type FormatId = '16:9' | '9:16' | '1:1' | '4:5';

export interface FormatDefinition {
  id: FormatId;
  label: string;
  usage: string;
  /** Export resolution. */
  width: number;
  height: number;
}

export const FORMATS: readonly FormatDefinition[] = [
  { id: '16:9', label: '16:9', usage: 'YouTube, site web', width: 1920, height: 1080 },
  { id: '9:16', label: '9:16', usage: 'Reels, TikTok, Shorts', width: 1080, height: 1920 },
  { id: '1:1', label: '1:1', usage: 'Post carré', width: 1080, height: 1080 },
  { id: '4:5', label: '4:5', usage: 'Post Instagram', width: 1080, height: 1350 },
];

export function getFormat(id: FormatId): FormatDefinition {
  return FORMATS.find((f) => f.id === id) ?? (FORMATS[0] as FormatDefinition);
}

/** Preview canvas size: same ratio as the export, at most `maxSide` px on its long side. */
export function previewSize(id: FormatId, maxSide = 960): { width: number; height: number } {
  const f = getFormat(id);
  const scale = maxSide / Math.max(f.width, f.height);
  return { width: Math.round(f.width * scale), height: Math.round(f.height * scale) };
}

/** Pixel factor: designs are drawn for a frame whose short side is 1080 px (1920×1080, 1080×1920). */
export function designScale(width: number, height: number): number {
  return Math.min(width, height) / 1080;
}
