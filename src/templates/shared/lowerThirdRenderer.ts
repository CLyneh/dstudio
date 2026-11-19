import { roundRect } from '@/engine/draw';
import { easeInCubic, easeOutBack, easeOutExpo } from '@/engine/easing';
import { hexToRgba } from '@/engine/color';
import { drawLogo, isWatermark } from '@/engine/logo';
import { clamp } from '@/engine/math';
import { VERTICAL_UNSAFE } from '@/engine/safeZones';
import type { RenderContext } from '@/engine/types';
import type { Choice } from '../types';
import { cased, interFont, titleFont } from './typography';

export const LOWER_THIRD_ANIMATIONS: Choice[] = [
  { id: 'drawer-slide', label: 'Tiroir latéral', description: 'Barre + déploiement' },
  { id: 'curtain-mask', label: 'Rideau masqué', description: 'Ouverture verticale' },
  { id: 'line-expand', label: 'Expansion ligne', description: 'Tracé séparateur central' },
  { id: 'elastic-pop', label: 'Pop élastique', description: 'Rebond moderne dynamique' },
];

export const LOWER_THIRD_VARIANTS: Choice[] = [
  { id: 'dark-glass', label: 'Sombre verre', description: 'Lisible sur tout' },
  { id: 'editorial-white', label: 'Blanc éditorial', description: 'Net et sobre' },
  { id: 'rose-signature', label: 'Signature', description: "Aux couleurs de l'accent" },
];

export function lowerThirdPhases(duration: number) {
  return {
    inEnd: Math.min(0.75, duration * 0.25),
    outStart: duration - Math.min(0.65, duration * 0.22),
  };
}

function palette(variant: string, accent: string) {
  if (variant === 'editorial-white') {
    return {
      bg: 'rgba(255, 255, 255, 0.96)',
      border: 'rgba(15, 23, 42, 0.12)',
      name: '#09090B',
      role: '#475569',
      bar: accent,
    };
  }
  if (variant === 'rose-signature') {
    const white = accent.toUpperCase() === '#FFFFFF';
    return {
      bg: hexToRgba(accent, 0.95),
      border: 'rgba(255, 255, 255, 0.35)',
      name: white ? '#09090B' : '#FFFFFF',
      role: white ? '#334155' : 'rgba(255, 255, 255, 0.90)',
      bar: white ? '#09090B' : '#FFFFFF',
    };
  }
  return {
    bg: 'rgba(13, 16, 25, 0.92)',
    border: 'rgba(255, 255, 255, 0.14)',
    name: '#FFFFFF',
    role: '#CBD5E1',
    bar: accent,
  };
}

/** Name + role card at the bottom of the frame, with an accent bar on its side. */
export function drawLowerThirdCard(rc: RenderContext, rawName: string, rawRole: string): void {
  const { ctx, width: W, height: H, time: t, duration, scale: S, portrait, style } = rc;
  const name = cased(rc, rawName) || 'Intervenant';
  const role = cased(rc, rawRole);

  const enterRaw = clamp(t / Math.min(0.75, duration * 0.25));
  const exitLength = Math.min(0.65, duration * 0.22);
  const exitRaw = t > duration - exitLength ? clamp((t - (duration - exitLength)) / exitLength) : 0;
  const easeIn = easeOutExpo(enterRaw);
  const easeOut = easeInCubic(exitRaw);
  const visibility = easeIn * (1 - easeOut);

  if (isWatermark(rc)) drawLogo(rc);
  if (visibility <= 0.001) return;

  const k = Math.min(1.25, Math.max(0.8, style.textScale));
  const nameSize = Math.round((portrait ? 50 : 52) * k * S);
  const roleSize = Math.round((portrait ? 29 : 31) * k * S);
  ctx.font = titleFont(rc, 800, nameSize);
  const nameW = ctx.measureText(name).width;
  ctx.font = interFont(500, roleSize);
  const roleW = role ? ctx.measureText(role).width : 0;

  const barW = (portrait ? 14 : 16) * S;
  const padInner = (portrait ? 34 : 40) * S;
  const padOuter = (portrait ? 44 : 54) * S;
  const padY = (portrait ? 28 : 30) * S;
  const gap = role ? 13 * S : 0;
  const boxW = Math.min(W * (portrait ? 0.88 : 0.78), barW + padInner + Math.max(nameW, roleW) + padOuter);
  const boxH = padY * 2 + nameSize + gap + (role ? roleSize : 0);
  const radius = 20 * S;

  const isRight = style.position === 'right';
  const marginX = portrait ? (W - boxW) / 2 : 105 * S;
  const marginBottom = portrait
    ? style.safeVertical
      ? H * VERTICAL_UNSAFE.bottom + 40 * S
      : 250 * S
    : 100 * S;
  let x = marginX;
  if (style.position === 'center') x = (W - boxW) / 2;
  else if (isRight) x = portrait ? (W - boxW) / 2 : W - marginX - boxW;
  const y = H - marginBottom - boxH;

  const c = palette(style.variant, style.accent);
  const anim = rc.animation.style;
  const nameY = padY + nameSize * 0.82;
  const roleY = nameY + gap + roleSize * 0.88;

  const texts = (anchorX: number, baseY: number, nameShift = 0, roleShift = 0) => {
    ctx.textAlign = isRight ? 'right' : 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = c.name;
    ctx.font = titleFont(rc, 800, nameSize);
    ctx.fillText(name, anchorX, baseY + nameY + nameShift);
    if (role) {
      ctx.fillStyle = c.role;
      ctx.font = interFont(500, roleSize);
      ctx.fillText(role, anchorX, baseY + roleY + roleShift);
    }
  };

  ctx.save();
  if (anim === 'elastic-pop') {
    const pop = easeOutBack(enterRaw) * (1 - easeOut * 0.15);
    ctx.globalAlpha = visibility;
    ctx.translate(x + boxW / 2, y + boxH / 2 + (1 - easeIn) * 40 * S + easeOut * 30 * S);
    ctx.scale(pop, pop);
    ctx.translate(-boxW / 2, -boxH / 2);
    roundRect(ctx, 0, 0, boxW, boxH, radius);
    ctx.fillStyle = c.bg;
    ctx.fill();
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 3 * S;
    ctx.stroke();
    ctx.save();
    roundRect(ctx, 0, 0, boxW, boxH, radius);
    ctx.clip();
    ctx.fillStyle = c.bar;
    ctx.fillRect(isRight ? boxW - barW : 0, 0, barW, boxH);
    ctx.restore();
    texts(isRight ? boxW - barW - padInner : barW + padInner, 0);
  } else if (anim === 'curtain-mask') {
    const curH = boxH * visibility;
    const curY = y + (boxH - curH) / 2;
    roundRect(ctx, x, curY, boxW, curH, radius);
    ctx.clip();
    ctx.fillStyle = c.bg;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 3 * S;
    roundRect(ctx, x, curY, boxW, curH, radius);
    ctx.stroke();
    ctx.fillStyle = c.bar;
    ctx.fillRect(isRight ? x + boxW - barW : x, y, barW, boxH);
    texts(isRight ? x + boxW - barW - padInner : x + barW + padInner, y);
  } else if (anim === 'line-expand') {
    const lineW = (boxW - 60 * S) * visibility;
    const lineX = isRight ? x + boxW - 30 * S - lineW : x + 30 * S;
    const midY = y + padY + nameSize + gap * 0.5;
    ctx.globalAlpha = visibility;
    roundRect(ctx, x, y, boxW, boxH, radius);
    ctx.fillStyle = c.bg;
    ctx.fill();
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 3 * S;
    ctx.stroke();
    ctx.fillStyle = c.bar;
    ctx.fillRect(lineX, midY - 2 * S, lineW, 4 * S);
    texts(isRight ? x + boxW - 36 * S : x + 36 * S, y, -(1 - easeIn) * 18 * S, (1 - easeIn) * 18 * S);
  } else {
    // drawer-slide (default)
    const barScaleY = clamp(enterRaw / 0.35) * (1 - clamp((exitRaw - 0.65) / 0.35));
    const reveal = easeOutExpo(clamp((enterRaw - 0.14) / 0.86)) * (1 - easeInCubic(clamp(exitRaw / 0.78)));
    const currentW = barW + (boxW - barW) * reveal;
    const revealX = isRight ? x + boxW - currentW : x;
    ctx.save();
    ctx.globalAlpha = visibility;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 28 * S;
    ctx.shadowOffsetY = 10 * S;
    roundRect(ctx, revealX, y, currentW, boxH, radius);
    ctx.fillStyle = c.bg;
    ctx.fill();
    ctx.restore();

    ctx.save();
    roundRect(ctx, revealX, y, currentW, boxH, radius);
    ctx.clip();
    ctx.fillStyle = c.bg;
    ctx.fillRect(x, y, boxW, boxH);
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 3 * S;
    roundRect(ctx, revealX, y, currentW, boxH, radius);
    ctx.stroke();
    const shift = (isRight ? 1 : -1) * (1 - reveal) * 42 * S;
    ctx.globalAlpha = clamp((reveal - 0.18) / 0.82);
    texts((isRight ? x + boxW - barW - padInner : x + barW + padInner) + shift, y);
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.bar;
    const barH = boxH * barScaleY;
    ctx.fillRect(isRight ? x + boxW - barW : x, y + (boxH - barH) / 2, barW, barH);
    ctx.restore();
  }
  ctx.restore();

  if (!isWatermark(rc)) drawLogo(rc, { topY: y, badgeLeftX: x, badgeY: y + boxH / 2 });
}
