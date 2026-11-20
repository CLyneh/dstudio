import { roundRect, setLetterSpacing } from '@/engine/draw';
import { easeOutBack, easeOutExpo, easeOutQuint } from '@/engine/easing';
import { drawLogo, isWatermark } from '@/engine/logo';
import { clamp } from '@/engine/math';
import { exitProgress, stepProgress } from '@/engine/timing';
import type { RenderContext } from '@/engine/types';
import type { Choice } from '../types';
import { cased, drawWordPopLine, fitTitleSize, interFont, onAccent, shadow, titleFont } from './typography';

/** The 7 chapter animations of Motion Studio v2. */
export const CHAPTER_ANIMATIONS: Choice[] = [
  { id: 'slide-mask', label: 'Slide & masque', description: 'Révélation nette + trait de couleur' },
  { id: 'marker-highlight', label: 'Surlignage marqueur', description: 'Bande colorée façon Vox' },
  { id: 'word-pop', label: 'Mot par mot (Reels)', description: 'Rebond dynamique rythmé' },
  { id: 'zoom-impact', label: 'Zoom impact', description: 'Apparition punchy & rebond' },
  { id: 'glitch-flash', label: 'Glitch & flash', description: 'Décalage RVB moderne' },
  { id: 'cinema-tracking', label: 'Écartement cinéma', description: 'Tracking lettres grand écran' },
  { id: 'framed-box', label: 'Carton encadré', description: 'Cadre sombre avec bordure de couleur' },
];

const SUB_COLOR = '#CBD5E1';

export interface ChapterText {
  kicker: string;
  title: string;
  subtitle: string;
  /** Subtitle color; defaults to the light grey of Motion Studio v2. */
  subtitleColor?: string;
}

export function chapterPhases(duration: number) {
  return { inEnd: Math.min(duration, 0.9), outStart: duration - Math.min(0.5, duration * 0.22) };
}

/** Small accent label above, very big title, optional subtitle below. */
export function drawChapterTitle(rc: RenderContext, text: ChapterText): void {
  const { ctx, width: W, height: H, time: t, duration, scale: S, portrait, style } = rc;
  const cx = W / 2;
  const cy = H / 2;
  const primary = style.textColor;
  const accent = style.accent;
  const top = cased(rc, text.kicker);
  const main = cased(rc, text.title) || 'Chapitre';
  const sub = cased(rc, text.subtitle);
  const exit = exitProgress(t, duration, 0.5, 0.22);
  const easeOut = exit.out;
  const exitAlpha = 1 - easeOut;

  const fontSize = fitTitleSize(
    rc,
    (portrait ? 106 : 128) * style.textScale * S * (style.fontId === 'bebas-neue' ? 1.2 / 1.18 : 1),
    900,
    [main],
    W * (portrait ? 0.86 : 0.84),
  );
  const topSize = Math.round((portrait ? 30 : 24) * Math.min(1.2, style.textScale) * S);
  const subSize = Math.round((portrait ? 36 : 30) * Math.min(1.2, style.textScale) * S);

  if (isWatermark(rc)) drawLogo(rc);
  if (exitAlpha <= 0.001) return;

  const anim = rc.animation.style;
  const topY = cy - fontSize * 0.92;
  const subY = cy + fontSize * 0.92;

  const drawTop = (alpha: number, y: number, spacing = 5, weight = 800, xShift = 2.5) => {
    if (!top) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = interFont(weight, topSize);
    setLetterSpacing(ctx, spacing * S);
    ctx.fillStyle = accent;
    shadow(rc);
    ctx.fillText(top, cx + xShift * S, y, W * 0.9);
    ctx.restore();
  };
  const drawSub = (alpha: number, y: number, withShadow = true) => {
    if (!sub) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = titleFont(rc, 500, subSize);
    ctx.fillStyle = text.subtitleColor ?? SUB_COLOR;
    shadow(rc, withShadow);
    // Long subtitles (e.g. a card question) wrap instead of leaving the frame.
    const lines = wrapLines(ctx, sub, W * 0.86, 3);
    lines.forEach((line, i) => ctx.fillText(line, cx, y + i * subSize * 1.3, W * 0.9));
    ctx.restore();
  };

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (anim === 'marker-highlight') {
    const textT = easeOutQuint(stepProgress(t, 0, 0.52));
    const markT = easeOutExpo(stepProgress(t, 0.22, 0.58));
    const topT = easeOutExpo(stepProgress(t, 0.1, 0.5));
    const subT = easeOutQuint(stepProgress(t, 0.35, 0.5));
    ctx.font = titleFont(rc, 900, fontSize);
    const fullW = ctx.measureText(main).width + 68 * S;
    const boxH = fontSize + 32 * S;
    drawTop(exitAlpha * topT, topY - 12 * S);
    ctx.save();
    ctx.globalAlpha = exitAlpha;
    ctx.fillStyle = accent;
    shadow(rc);
    roundRect(ctx, cx - fullW / 2, cy - boxH / 2, fullW * markT * (1 - easeOut), boxH, 16 * S);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = exitAlpha * textT;
    ctx.font = titleFont(rc, 900, fontSize);
    ctx.fillStyle = onAccent(accent);
    ctx.fillText(main, cx, cy + (1 - textT) * 16 * S);
    ctx.restore();
    drawSub(exitAlpha * subT, subY + 20 * S);
  } else if (anim === 'word-pop') {
    const topT = easeOutExpo(stepProgress(t, 0, 0.45));
    const subT = easeOutQuint(stepProgress(t, 0.35, 0.45));
    drawTop(exitAlpha * topT, topY);
    ctx.save();
    ctx.globalAlpha = exitAlpha;
    shadow(rc);
    drawWordPopLine(rc, main, cx, cy - easeOut * 20 * S, 0.08, fontSize, primary, true);
    ctx.restore();
    drawSub(exitAlpha * subT, subY);
  } else if (anim === 'zoom-impact') {
    const popT = easeOutBack(stepProgress(t, 0, 0.58));
    const fadeT = easeOutExpo(stepProgress(t, 0, 0.4));
    const subT = easeOutQuint(stepProgress(t, 0.25, 0.5));
    const zoom = 0.76 + 0.24 * popT + easeOut * 0.12;
    ctx.save();
    ctx.globalAlpha = exitAlpha * fadeT;
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
    drawTop(ctx.globalAlpha, topY);
    ctx.font = titleFont(rc, 900, fontSize);
    ctx.fillStyle = primary;
    shadow(rc);
    ctx.fillText(main, cx, cy);
    drawSub(exitAlpha * subT, subY, false);
    ctx.restore();
  } else if (anim === 'glitch-flash') {
    const enterT = easeOutExpo(stepProgress(t, 0, 0.45));
    const glitching = t < 0.36 || exit.raw > 0.25;
    const jitter = glitching ? Math.sin(t * 95) * 14 * S * (1 - enterT * 0.6) : 0;
    drawTop(exitAlpha * enterT, topY);
    ctx.save();
    ctx.font = titleFont(rc, 900, fontSize);
    if (glitching) {
      ctx.globalAlpha = exitAlpha * 0.75;
      ctx.fillStyle = '#06B6D4';
      ctx.fillText(main, cx - jitter * 1.4, cy - 3 * S);
      ctx.fillStyle = accent;
      ctx.fillText(main, cx + jitter * 1.4, cy + 3 * S);
    }
    ctx.globalAlpha = exitAlpha * clamp(enterT * 1.5);
    ctx.fillStyle = primary;
    shadow(rc);
    ctx.fillText(main, cx + jitter * 0.3, cy);
    ctx.restore();
    drawSub(exitAlpha * enterT, subY, false);
  } else if (anim === 'cinema-tracking') {
    const trackT = easeOutExpo(stepProgress(t, 0, 0.85));
    const subT = easeOutQuint(stepProgress(t, 0.3, 0.55));
    const spacing = ((1 - trackT) * 44 + easeOut * 20) * S;
    drawTop(exitAlpha * trackT, topY, 6 + (1 - trackT) * 14, 700, 4);
    ctx.save();
    ctx.globalAlpha = exitAlpha * clamp(trackT * 1.5);
    ctx.font = titleFont(rc, 800, fontSize);
    setLetterSpacing(ctx, spacing);
    ctx.fillStyle = primary;
    shadow(rc);
    ctx.fillText(main, cx + spacing * 0.45, cy);
    ctx.restore();
    drawSub(exitAlpha * subT, subY);
  } else if (anim === 'framed-box') {
    const frameT = easeOutExpo(stepProgress(t, 0, 0.62));
    const textT = easeOutQuint(stepProgress(t, 0.18, 0.58));
    ctx.font = titleFont(rc, 900, fontSize);
    const boxW = Math.min(W * 0.9, Math.max(ctx.measureText(main).width + 130 * S, 420 * S));
    const boxH = fontSize + (top ? 130 : 88) * S + (sub ? 55 : 0) * S;
    ctx.save();
    ctx.globalAlpha = exitAlpha * frameT;
    roundRect(ctx, cx - boxW / 2, cy - boxH / 2, boxW, boxH, 24 * S);
    ctx.fillStyle = 'rgba(11, 13, 20, 0.86)';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4 * S;
    ctx.stroke();
    ctx.globalAlpha = exitAlpha * textT;
    const mainOffset = (top ? (sub ? 6 : 16) : sub ? -14 : 0) * S;
    if (top) {
      ctx.save();
      ctx.font = interFont(800, topSize);
      setLetterSpacing(ctx, 5 * S);
      ctx.fillStyle = accent;
      ctx.fillText(top, cx + 2.5 * S, cy - boxH / 2 + 44 * S);
      ctx.restore();
    }
    ctx.font = titleFont(rc, 900, fontSize);
    ctx.fillStyle = primary;
    ctx.fillText(main, cx, cy + mainOffset + (1 - textT) * 18 * S);
    if (sub) {
      ctx.font = titleFont(rc, 500, subSize);
      ctx.fillStyle = text.subtitleColor ?? SUB_COLOR;
      ctx.fillText(sub, cx, cy + boxH / 2 - 42 * S);
    }
    ctx.restore();
  } else {
    // slide-mask (default)
    const topT = easeOutExpo(stepProgress(t, 0, 0.5));
    const mainT = easeOutQuint(stepProgress(t, 0.12, 0.62));
    const barT = easeOutExpo(stepProgress(t, 0.28, 0.55));
    const subT = easeOutQuint(stepProgress(t, 0.34, 0.55));
    drawTop(exitAlpha * topT, topY + (1 - topT) * 20 * S - easeOut * 15 * S, 6, 800, 3);
    ctx.save();
    const maskH = fontSize * 1.38;
    ctx.beginPath();
    ctx.rect(0, cy - maskH / 2, W, maskH);
    ctx.clip();
    ctx.globalAlpha = exitAlpha;
    ctx.font = titleFont(rc, 900, fontSize);
    ctx.fillStyle = primary;
    shadow(rc);
    ctx.fillText(main, cx, cy + (1 - mainT) * fontSize * 1.15 - easeOut * 32 * S);
    ctx.restore();
    const barW = Math.min(180 * S, W * 0.18) * barT * (1 - easeOut);
    ctx.save();
    ctx.globalAlpha = exitAlpha;
    ctx.fillStyle = accent;
    shadow(rc);
    roundRect(ctx, cx - barW / 2, cy + fontSize * 0.68, barW, 9 * S, 4.5 * S);
    ctx.fill();
    ctx.restore();
    drawSub(exitAlpha * subT, subY + 18 * S + (1 - subT) * 18 * S);
  }

  ctx.restore();

  if (!isWatermark(rc)) {
    drawLogo(rc, {
      topY: top ? topY - topSize : cy - fontSize * 0.65,
      badgeLeftX: cx - 180 * S,
      badgeY: topY,
    });
  }
}

/** Splits `text` into lines no wider than `maxWidth` (at most `maxLines`; the last one may be compressed). */
function wrapLines(ctx: RenderContext['ctx'], text: string, maxWidth: number, maxLines: number): string[] {
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (!current || ctx.measureText(test).width <= maxWidth) current = test;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  if (lines.length <= maxLines) return lines;
  return [...lines.slice(0, maxLines - 1), lines.slice(maxLines - 1).join(' ')];
}
