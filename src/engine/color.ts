const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string): boolean {
  return HEX.test(value.trim());
}

/** Returns "#rrggbb" (lowercase) or null when the input is not a hex color. */
export function normalizeHex(value: string): string | null {
  const match = HEX.exec(value.trim());
  if (!match || !match[1]) return null;
  let hex = match[1].toLowerCase();
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join('');
  return `#${hex}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt((normalizeHex(hex) ?? '#000000').slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Relative luminance (WCAG), 0 = black, 1 = white. */
export function luminance(hex: string): number {
  const n = parseInt((normalizeHex(hex) ?? '#000000').slice(1), 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** Text color that stays readable on top of `background`. */
export function readableOn(background: string): '#111318' | '#ffffff' {
  return luminance(background) > 0.55 ? '#111318' : '#ffffff';
}
