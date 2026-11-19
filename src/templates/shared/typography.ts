import { roundRect, setLetterSpacing, setTextShadow } from '@/engine/draw';
import { easeOutBack, easeOutExpo } from '@/engine/easing';
import { cssFont, getFont, INTER } from '@/engine/fonts';
import { hexToRgba } from '@/engine/color';
import { clamp } from '@/engine/math';
import { applyCase } from '@/engine/text';
import type { RenderContext } from '@/engine/types';

/** Title font of the project at a given weight / size. */
export function titleFont(rc: RenderContext, weight: number, size: number): string {
  return cssFont(getFont(rc.style.fontId), weight, size);
}

export function interFont(weight: number, size: number): string {
  return cssFont(INTER, weight, size);
}

/** Base title size boosted for condensed fonts and shrunk so the widest line fits `maxWidth`. */
export function fitTitleSize(
  rc: RenderContext,
  base: number,
  weight: number,
  lines: string[],
  maxWidth: number,
): number {
  const { ctx } = rc;
  let size = base * getFont(rc.style.fontId).sizeBoost;
  ctx.font = titleFont(rc, weight, size);
  const widest = Math.max(0, ...lines.map((l) => ctx.measureText(l).width));
  if (widest > maxWidth && widest > 0) size *= maxWidth / widest;
  return Math.round(size);
}

/** Text with the project's case applied. */
export function cased(rc: RenderContext, text: string | undefined): string {
  return applyCase((text ?? '').trim(), rc.style.textCase);
}

/** Text that stays readable on the accent color. */
export function onAccent(accent: string): string {
  return accent.toUpperCase() === '#FFFFFF' ? '#09090B' : '#FFFFFF';
}

/** Dark pill with an accent outline, used for intro labels. Returns its box (for the logo). */
export function drawPillBadge(
  rc: RenderContext,
  cx: number,
  y: number,
  rawText: string,
  alpha: number,
  offsetY: number,
): { leftX: number; centerY: number; topY: number } | null {
  const { ctx, scale: S, portrait, style } = rc;
  const text = cased(rc, rawText);
  if (!text || alpha <= 0.005) return null;
  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  const fontSize = Math.round((portrait ? 24 : 22) * Math.min(1.15, style.textScale) * S);
  ctx.font = titleFont(rc, 700, fontSize);
  setLetterSpacing(ctx, 4 * S);
  const pillW = ctx.measureText(text).width + 56 * S;
  const pillH = fontSize + 24 * S;
  const drawY = y + offsetY;
  roundRect(ctx, cx - pillW / 2, drawY - pillH / 2, pillW, pillH, pillH / 2);
  ctx.fillStyle = 'rgba(13, 16, 24, 0.82)';
  ctx.fill();
  ctx.strokeStyle = hexToRgba(style.accent, 0.85);
  ctx.lineWidth = 2.5 * S;
  ctx.stroke();
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx + 2 * S, drawY + S);
  ctx.restore();
  return { leftX: cx - pillW / 2, centerY: drawY, topY: drawY - pillH / 2 };
}

/** Words popping one after another (Reels style). `highlightLast` paints the last word in the accent. */
export function drawWordPopLine(
  rc: RenderContext,
  text: string,
  cx: number,
  y: number,
  startTime: number,
  fontSize: number,
  color: string,
  highlightLast: boolean,
): void {
  const { ctx, time, scale: S, style } = rc;
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return;
  ctx.font = titleFont(rc, 900, fontSize);
  const spaceW = ctx.measureText(' ').width * 1.15;
  const widths = words.map((w) => ctx.measureText(w).width);
  const totalW = widths.reduce((a, w) => a + w, 0) + spaceW * (words.length - 1);
  let cursor = cx - totalW / 2;
  words.forEach((word, i) => {
    const w = widths[i] as number;
    const progress = clamp((time - (startTime + i * 0.13)) / 0.42);
    if (progress > 0) {
      const pop = easeOutBack(progress);
      ctx.save();
      ctx.globalAlpha *= clamp(progress * 2.2);
      ctx.translate(cursor + w / 2, y + (1 - easeOutExpo(progress)) * 22 * S);
      ctx.scale(pop, pop);
      ctx.fillStyle = highlightLast && i === words.length - 1 ? style.accent : color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(word, 0, 0);
      ctx.restore();
    }
    cursor += w + spaceW;
  });
}

/** Applies the studio's text shadow unless shadows are off (green background). */
export function shadow(rc: RenderContext, on = true): void {
  setTextShadow(rc.ctx, on && rc.shadows, rc.scale);
}
