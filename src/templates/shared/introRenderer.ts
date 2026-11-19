import { clearShadow, roundRect, setBlur, setLetterSpacing } from '@/engine/draw';
import { easeOutExpo, easeOutQuint } from '@/engine/easing';
import { hexToRgba } from '@/engine/color';
import { drawLogo, isWatermark } from '@/engine/logo';
import { clamp } from '@/engine/math';
import { exitProgress, stepProgress } from '@/engine/timing';
import type { RenderContext } from '@/engine/types';
import type { Choice } from '../types';
import {
  cased,
  drawPillBadge,
  drawWordPopLine,
  fitTitleSize,
  onAccent,
  shadow,
  titleFont,
} from './typography';

/** The 7 title animations of Motion Studio v2. */
export const INTRO_ANIMATIONS: Choice[] = [
  { id: 'split-reveal', label: 'Split & Révélation', description: 'Ligne de couleur + ouverture' },
  { id: 'word-pop', label: 'Mot par mot (Pop)', description: 'Rebond YouTube / Reels' },
  { id: 'cinema-minimal', label: 'Cinéma minimal', description: 'Glissement masqué & zoom' },
  { id: 'kinetic-impact', label: 'Impact typo', description: 'Cartouche & resserrage' },
  { id: 'typewriter', label: 'Machine à écrire', description: 'Frappe + curseur' },
  { id: 'blur-reveal', label: 'Flou cinétique', description: 'Défloutage fluide latéral' },
  { id: 'editorial-card', label: 'Carton éditorial', description: "Cadre avec repères d'angles" },
];

export interface IntroText {
  badge: string;
  line1: string;
  line2: string;
}

export function introPhases(duration: number) {
  return { inEnd: Math.min(duration, 1.1), outStart: duration - Math.min(0.6, duration * 0.22) };
}

/** Two big lines (second in the accent color) with an optional pill label above. */
export function drawIntroTitle(rc: RenderContext, text: IntroText): void {
  const { ctx, width: W, height: H, time: t, duration, scale: S, portrait, style } = rc;
  const cx = W / 2;
  const cy = H / 2;
  const primary = style.textColor;
  const accent = style.accent;
  const line1 = cased(rc, text.line1);
  const line2 = cased(rc, text.line2);
  const hasLine2 = !!line2;
  const exit = exitProgress(t, duration, 0.6, 0.22);
  const easeOut = exit.out;
  const exitAlpha = 1 - easeOut;

  const fontSize = fitTitleSize(
    rc,
    (portrait ? 98 : 114) * style.textScale * S,
    800,
    [line1, line2],
    W * (portrait ? 0.86 : 0.82),
  );

  if (isWatermark(rc)) drawLogo(rc);
  if (exitAlpha <= 0.001) return;

  const anim = rc.animation.style;
  const y1 = hasLine2 ? cy - fontSize * 0.64 : cy;
  const y2 = cy + fontSize * 0.68;
  const badgeY = y1 - fontSize * 1.05;
  let badgeBox: ReturnType<typeof drawPillBadge>;
  const badge = (progress: number, lift: number, y = badgeY) =>
    text.badge.trim()
      ? drawPillBadge(rc, cx, y, text.badge, progress * exitAlpha, (1 - progress) * -lift * S)
      : null;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (anim === 'word-pop') {
    const badgeT = easeOutExpo(stepProgress(t, 0, 0.45));
    ctx.save();
    ctx.globalAlpha = exitAlpha;
    shadow(rc);
    drawWordPopLine(rc, line1, cx, y1 - easeOut * 22 * S, 0.08, fontSize, primary, false);
    if (hasLine2) {
      const start2 = 0.08 + line1.split(/\s+/).filter(Boolean).length * 0.14 + 0.08;
      drawWordPopLine(rc, line2, cx, y2 - easeOut * 22 * S, start2, fontSize, accent, false);
    }
    ctx.restore();
    badgeBox = badge(badgeT, 14);
  } else if (anim === 'cinema-minimal') {
    const t1 = easeOutQuint(stepProgress(t, 0, 0.72));
    const t2 = easeOutQuint(stepProgress(t, 0.22, 0.72));
    const barT = easeOutExpo(stepProgress(t, 0.4, 0.6));
    const badgeT = easeOutExpo(stepProgress(t, 0.48, 0.6));
    const drift = 0.97 + 0.04 * (t / duration);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(drift, drift);
    ctx.translate(-cx, -cy);
    const maskH = fontSize * 1.3;
    const maskedLine = (line: string, y: number, color: string, progress: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, y - maskH / 2, W, maskH);
      ctx.clip();
      ctx.globalAlpha = exitAlpha;
      ctx.font = titleFont(rc, 800, fontSize);
      ctx.fillStyle = color;
      shadow(rc);
      ctx.fillText(line, cx, y + (1 - progress) * fontSize * 1.12 - easeOut * 30 * S);
      ctx.restore();
    };
    maskedLine(line1, y1, primary, t1);
    if (hasLine2) maskedLine(line2, y2, accent, t2);
    const barW = 145 * S * barT * (1 - easeOut);
    ctx.globalAlpha = exitAlpha;
    ctx.fillStyle = accent;
    shadow(rc);
    roundRect(ctx, cx - barW / 2, (hasLine2 ? y2 : y1) + fontSize * 0.78, barW, 8 * S, 4 * S);
    ctx.fill();
    badgeBox = badge(badgeT, 14);
    ctx.restore();
  } else if (anim === 'kinetic-impact') {
    const t1 = easeOutExpo(stepProgress(t, 0, 0.62));
    const t2 = easeOutExpo(stepProgress(t, 0.18, 0.65));
    const pillT = easeOutQuint(stepProgress(t, 0.3, 0.58));
    const badgeT = easeOutExpo(stepProgress(t, 0.44, 0.58));
    ctx.save();
    ctx.globalAlpha = exitAlpha * t1;
    ctx.font = titleFont(rc, 900, fontSize);
    const sp1 = (1 - t1) * 34 * S;
    setLetterSpacing(ctx, sp1);
    ctx.fillStyle = primary;
    shadow(rc);
    ctx.fillText(line1, cx + sp1 * 0.4, y1 - easeOut * 24 * S);
    ctx.restore();
    if (hasLine2) {
      ctx.save();
      ctx.font = titleFont(rc, 900, fontSize);
      const fullW = ctx.measureText(line2).width + 72 * S;
      const boxH = fontSize + 34 * S;
      ctx.globalAlpha = exitAlpha;
      ctx.fillStyle = accent;
      shadow(rc);
      roundRect(ctx, cx - fullW / 2, y2 - boxH / 2, fullW * pillT * (1 - easeOut), boxH, 18 * S);
      ctx.fill();
      clearShadow(ctx);
      ctx.globalAlpha = exitAlpha * t2;
      const sp2 = (1 - t2) * 28 * S;
      setLetterSpacing(ctx, sp2);
      ctx.fillStyle = onAccent(accent);
      ctx.fillText(line2, cx + sp2 * 0.4, y2 + 3 * S);
      ctx.restore();
    }
    badgeBox = badge(badgeT, 14);
  } else if (anim === 'typewriter') {
    const badgeT = easeOutExpo(stepProgress(t, 0, 0.45));
    const type1 = stepProgress(t, 0, 0.65);
    const type2 = hasLine2 ? stepProgress(t, 0.68, 0.75) : 1;
    const vis1 = line1.slice(0, Math.ceil(line1.length * type1));
    const vis2 = hasLine2 ? line2.slice(0, Math.ceil(line2.length * type2)) : '';
    ctx.save();
    ctx.globalAlpha = exitAlpha;
    ctx.font = titleFont(rc, 800, fontSize);
    shadow(rc);
    ctx.fillStyle = primary;
    ctx.fillText(vis1, cx, y1 - easeOut * 20 * S);
    if (hasLine2) {
      ctx.fillStyle = accent;
      ctx.fillText(vis2, cx, y2 - easeOut * 20 * S);
    }
    if (Math.floor(t * 5) % 2 === 0) {
      clearShadow(ctx);
      ctx.fillStyle = accent;
      const onLine2 = hasLine2 && type1 >= 1;
      const current = onLine2 ? vis2 : vis1;
      const curY = (onLine2 ? y2 : y1) - easeOut * 20 * S;
      const textW = ctx.measureText(current).width;
      ctx.fillRect(
        cx + textW / 2 + 12 * S,
        curY - fontSize * 0.42,
        Math.max(8 * S, fontSize * 0.06),
        fontSize * 0.84,
      );
    }
    ctx.restore();
    badgeBox = badge(badgeT, 14);
  } else if (anim === 'blur-reveal') {
    const t1 = easeOutQuint(stepProgress(t, 0, 0.8));
    const t2 = easeOutQuint(stepProgress(t, 0.22, 0.8));
    const badgeT = easeOutExpo(stepProgress(t, 0.4, 0.6));
    ctx.save();
    ctx.font = titleFont(rc, 800, fontSize);
    shadow(rc);
    const blurred = (line: string, x: number, y: number, color: string, progress: number) => {
      ctx.save();
      ctx.globalAlpha = exitAlpha * progress;
      setBlur(ctx, (1 - progress) * 18 * S);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      ctx.restore();
    };
    blurred(line1, cx - (1 - t1) * 75 * S + easeOut * 45 * S, y1, primary, t1);
    if (hasLine2) blurred(line2, cx + (1 - t2) * 75 * S - easeOut * 45 * S, y2, accent, t2);
    ctx.restore();
    badgeBox = badge(badgeT, 14);
  } else if (anim === 'editorial-card') {
    const cardT = easeOutExpo(stepProgress(t, 0, 0.65));
    const badgeT = easeOutExpo(stepProgress(t, 0.16, 0.58));
    const t1 = easeOutQuint(stepProgress(t, 0.28, 0.65));
    const t2 = easeOutQuint(stepProgress(t, 0.42, 0.65));
    const cardW = Math.min(portrait ? W * 0.88 : W * 0.72, 1380 * S);
    const cardH = portrait ? H * 0.44 : H * 0.56;
    const zoom = 0.94 + 0.06 * cardT;
    ctx.save();
    ctx.globalAlpha = exitAlpha * cardT;
    ctx.translate(cx, cy);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);
    roundRect(ctx, cx - cardW / 2, cy - cardH / 2, cardW, cardH, 30 * S);
    ctx.fillStyle = 'rgba(13, 16, 24, 0.88)';
    ctx.fill();
    ctx.strokeStyle = hexToRgba(accent, 0.65);
    ctx.lineWidth = 3 * S;
    ctx.stroke();
    const c = 24 * S;
    const pad = 24 * S;
    const l = cx - cardW / 2 + pad;
    const r = cx + cardW / 2 - pad;
    const top = cy - cardH / 2 + pad;
    const b = cy + cardH / 2 - pad;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3.5 * S;
    ctx.beginPath();
    ctx.moveTo(l, top + c);
    ctx.lineTo(l, top);
    ctx.lineTo(l + c, top);
    ctx.moveTo(r - c, top);
    ctx.lineTo(r, top);
    ctx.lineTo(r, top + c);
    ctx.moveTo(l, b - c);
    ctx.lineTo(l, b);
    ctx.lineTo(l + c, b);
    ctx.moveTo(r - c, b);
    ctx.lineTo(r, b);
    ctx.lineTo(r, b - c);
    ctx.stroke();
    badgeBox = badge(badgeT, 10, cy - cardH / 2 + 64 * S);
    ctx.globalAlpha = exitAlpha * t1;
    ctx.font = titleFont(rc, 800, fontSize * 0.9);
    ctx.fillStyle = primary;
    ctx.fillText(line1, cx, (hasLine2 ? cy - fontSize * 0.34 : cy + 12 * S) + (1 - t1) * 22 * S);
    if (hasLine2) {
      ctx.globalAlpha = exitAlpha * t2;
      ctx.fillStyle = accent;
      ctx.fillText(line2, cx, cy + fontSize * 0.66 + (1 - t2) * 22 * S);
    }
    ctx.restore();
  } else {
    // split-reveal (default)
    const lineT = easeOutExpo(stepProgress(t, 0, 0.55));
    const t1 = easeOutQuint(stepProgress(t, 0.2, 0.7));
    const t2 = easeOutQuint(stepProgress(t, 0.34, 0.7));
    const badgeT = easeOutExpo(stepProgress(t, 0.48, 0.6));
    const splitY = hasLine2 ? cy : cy + fontSize * 0.66;
    const dividerW = Math.min((portrait ? 520 : 660) * S, W * 0.52) * lineT * (1 - easeOut);
    ctx.save();
    ctx.globalAlpha = exitAlpha;
    ctx.fillStyle = accent;
    shadow(rc);
    roundRect(ctx, cx - dividerW / 2, splitY - 3 * S, dividerW, 6 * S, 3 * S);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, splitY - 4 * S);
    ctx.clip();
    ctx.globalAlpha = exitAlpha * clamp(t1 * 1.4);
    ctx.font = titleFont(rc, 800, fontSize);
    ctx.fillStyle = primary;
    shadow(rc);
    const start1 = splitY + fontSize * 0.52;
    ctx.fillText(line1, cx, start1 + (y1 - start1) * t1 - easeOut * 28 * S);
    ctx.restore();

    if (hasLine2) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, splitY + 4 * S, W, H - splitY);
      ctx.clip();
      ctx.globalAlpha = exitAlpha * clamp(t2 * 1.4);
      ctx.font = titleFont(rc, 800, fontSize);
      ctx.fillStyle = accent;
      shadow(rc);
      const start2 = splitY - fontSize * 0.52;
      ctx.fillText(line2, cx, start2 + (y2 - start2) * t2 + easeOut * 28 * S);
      ctx.restore();
    }
    badgeBox = badge(badgeT, 16);
  }

  ctx.restore();

  if (!isWatermark(rc)) {
    drawLogo(rc, {
      topY: badgeBox ? badgeBox.topY : y1 - fontSize * 0.65,
      badgeLeftX: badgeBox ? badgeBox.leftX : cx - 220 * S,
      badgeY: badgeBox ? badgeBox.centerY : badgeY,
    });
  }
}
