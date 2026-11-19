import type { Ctx2D } from './types';

/** Rounded rectangle path (radius clamped like the original studio). */
export function roundRect(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number): void {
  const radius = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function setLetterSpacing(ctx: Ctx2D, px: number): void {
  if ('letterSpacing' in ctx) (ctx as { letterSpacing: string }).letterSpacing = `${px}px`;
}

/** The studio's soft drop shadow under text, scaled to the frame. */
export function setTextShadow(ctx: Ctx2D, enabled: boolean, scale: number): void {
  if (enabled) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24 * scale;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6 * scale;
  } else {
    clearShadow(ctx);
  }
}

export function clearShadow(ctx: Ctx2D): void {
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

export function setBlur(ctx: Ctx2D, px: number): void {
  if ('filter' in ctx) ctx.filter = px > 0 ? `blur(${Math.round(px)}px)` : 'none';
}
