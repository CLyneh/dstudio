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

/** Extra size for tall frames, seen on a phone: ×1.4 in 9:16, ×1.13 in 4:5, none in 1:1 or landscape. */
export const VERTICAL_BOOST = 0.4;

/**
 * Pixel factor: designs are drawn for a frame whose short side is 1080 px (1920×1080, 1080×1920),
 * then enlarged in tall frames so titles and cards use the height of a phone screen.
 */
export function designScale(width: number, height: number): number {
  const tall = Math.min(1, Math.max(0, (height / width - 1) / (16 / 9 - 1)));
  return (Math.min(width, height) / 1080) * (1 + VERTICAL_BOOST * tall);
}
