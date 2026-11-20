import { hexToRgba } from '@/engine/color';
import { roundRect, setLetterSpacing } from '@/engine/draw';
import { easeInCubic, easeInOutCubic, easeOutBack, easeOutExpo } from '@/engine/easing';
import { drawLogo, isWatermark } from '@/engine/logo';
import { clamp } from '@/engine/math';
import type { ItemContent, RenderContext } from '@/engine/types';
import type { Choice } from '../types';
import { CHAPTER_ANIMATIONS, drawChapterTitle } from '../shared/chapterRenderer';
import { cased, interFont, onAccent, titleFont } from '../shared/typography';

export const CARD_ANIMATIONS: Choice[] = [
  {
    id: 'zoom-intertitle',
    label: 'Zoom & intertitre',
    description: 'La carte apparaît, zoome, puis le texte',
  },
  { id: 'card-flip-3d', label: 'Retournement 3D', description: 'Dos géométrique → face + reflet' },
  { id: 'deal-slide', label: 'Tirage de paquet', description: 'Glisse depuis la pioche + rebond' },
  { id: 'fan-snap', label: 'Distribution éventail', description: 'Paquet en éventail & claquement' },
  { id: 'holo-float', label: 'Lévitation & holo', description: 'Inclinaison 3D & balayage brillant' },
];

/** Text entrance of "Zoom & intertitre": two own styles + the chapter animations of Motion Studio v2. */
export const CARD_TEXT_ANIMATIONS: Choice[] = [
  { id: 'slide-mask', label: 'Slide & masque', description: 'Révélation nette + trait de couleur' },
  { id: 'fade', label: 'Fondu', description: 'Le texte apparaît en douceur' },
  { id: 'typewriter', label: 'Machine à écrire', description: 'Lettre par lettre avec un curseur' },
  ...CHAPTER_ANIMATIONS.filter((a) => a.id !== 'slide-mask'),
];

export const CARD_BACKS: Choice[] = [
  { id: 'geometric', label: 'Losanges', description: 'Motif géométrique façon jeu de cartes' },
  {
    id: 'solid-logo',
    label: 'Couleur unie + logo',
    description: "Couleur d'accent et logo du kit au centre",
  },
  { id: 'minimal', label: 'Minimaliste', description: 'Fond uni et un simple trait de couleur' },
];

export const CARD_VARIANTS: Choice[] = [
  { id: 'noir-collector', label: 'Noir collector', description: 'Sombre texturé & liseré luxe' },
  { id: 'ivoire-boardgame', label: 'Ivoire jeu de société', description: 'Papier épais crème & encre' },
  { id: 'neon-arcade', label: 'Néon arcade', description: 'Halo lumineux & grille cyber' },
  { id: 'minimal-bmc', label: 'Minimaliste blanc', description: 'Façon Blanc Manger Coco' },
  { id: 'solid-color', label: 'Couleur unie', description: "Carte pleine à la couleur d'accent" },
];

interface Palette {
  bgTop: string;
  bgBottom: string;
  outerBorder: string;
  innerBorder: string;
  badgeBg: string;
  badgeText: string;
  titleColor: string;
  bodyColor: string;
  footerColor: string;
  backPrimary: string;
  backSecondary: string;
  /** Separator, corner diamonds and footer rule. */
  ornament: string;
}

function cardPalette(theme: string, accent: string, textColor: string): Palette {
  return { ornament: accent, ...basePalette(theme, accent, textColor) };
}

function basePalette(theme: string, accent: string, textColor: string): Omit<Palette, 'ornament'> | Palette {
  if (theme === 'solid-color') {
    const ink = onAccent(accent);
    return {
      bgTop: accent,
      bgBottom: accent,
      outerBorder: accent,
      innerBorder: hexToRgba(ink, 0.35),
      badgeBg: ink,
      badgeText: accent,
      titleColor: ink,
      bodyColor: ink,
      footerColor: hexToRgba(ink, 0.8),
      backPrimary: '#0F121C',
      backSecondary: '#181C2B',
      ornament: ink,
    };
  }
  if (theme === 'ivoire-boardgame') {
    return {
      bgTop: '#FAF7F0',
      bgBottom: '#EFECE3',
      outerBorder: '#18181B',
      innerBorder: accent,
      badgeBg: accent,
      badgeText: onAccent(accent),
      titleColor: '#09090B',
      bodyColor: '#3F3F46',
      footerColor: '#71717A',
      backPrimary: '#18181B',
      backSecondary: '#27272A',
    };
  }
  if (theme === 'neon-arcade') {
    return {
      bgTop: '#0B0F1E',
      bgBottom: '#151029',
      outerBorder: accent,
      innerBorder: '#38BDF8',
      badgeBg: accent,
      badgeText: onAccent(accent),
      titleColor: textColor,
      bodyColor: '#E2E8F0',
      footerColor: '#38BDF8',
      backPrimary: '#0B0F1E',
      backSecondary: '#1E1B4B',
    };
  }
  if (theme === 'minimal-bmc') {
    return {
      bgTop: '#FFFFFF',
      bgBottom: '#F8FAFC',
      outerBorder: '#09090B',
      innerBorder: 'rgba(9, 9, 11, 0.14)',
      badgeBg: '#09090B',
      badgeText: '#FFFFFF',
      titleColor: '#09090B',
      bodyColor: '#18181B',
      footerColor: '#52525B',
      backPrimary: '#09090B',
      backSecondary: '#18181B',
    };
  }
  return {
    bgTop: '#121520',
    bgBottom: '#090B11',
    outerBorder: accent,
    innerBorder: hexToRgba(accent, 0.45),
    badgeBg: accent,
    badgeText: onAccent(accent),
    titleColor: textColor,
    bodyColor: '#CBD5E1',
    footerColor: '#94A3B8',
    backPrimary: '#0F121C',
    backSecondary: '#181C2B',
  };
}

/** Horizontally centered paragraph whose first line is at `firstY`, up to `maxLines` lines. */
function wrapBelow(
  rc: RenderContext,
  text: string,
  firstY: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const { ctx } = rc;
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !current) current = test;
    else {
      lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  lines.forEach((line, i) => ctx.fillText(line, 0, firstY + i * lineHeight));
}

/** Card coordinates are in "card pixels" (a 510×720 card), scaled by the caller. */
function paintBack(rc: RenderContext, w: number, h: number, r: number, p: Palette, back: string) {
  const { ctx } = rc;
  const accent = rc.style.accent;
  if (back === 'solid-logo') return paintSolidLogoBack(rc, w, h, r);
  if (back === 'minimal') return paintMinimalBack(rc, w, h, r, p);
  const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  grad.addColorStop(0, p.backSecondary);
  grad.addColorStop(1, p.backPrimary);
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.save();
  const inset = 22;
  roundRect(ctx, -w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, r - 10);
  ctx.clip();
  ctx.strokeStyle = hexToRgba(accent, 0.22);
  ctx.lineWidth = 2;
  for (let d = -(w + h); d <= w + h; d += 42) {
    ctx.beginPath();
    ctx.moveTo(d, -h / 2);
    ctx.lineTo(d + h, h / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(d, -h / 2);
    ctx.lineTo(d - h, h / 2);
    ctx.stroke();
  }
  ctx.strokeStyle = hexToRgba(accent, 0.75);
  ctx.lineWidth = 3;
  roundRect(ctx, -w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, r - 10);
  ctx.stroke();
  ctx.save();
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = p.backPrimary;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 4;
  roundRect(ctx, -58, -58, 116, 116, 16);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.quadraticCurveTo(0, 0, 34, 0);
  ctx.quadraticCurveTo(0, 0, 0, 34);
  ctx.quadraticCurveTo(0, 0, -34, 0);
  ctx.quadraticCurveTo(0, 0, 0, -34);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Plain accent color with the brand logo in the middle (nothing else when the kit has no logo). */
function paintSolidLogoBack(rc: RenderContext, w: number, h: number, r: number) {
  const { ctx } = rc;
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = rc.style.accent;
  ctx.fill();
  const logo = rc.logo.image;
  if (!logo) return;
  const ratio = Math.min((w * 0.56) / logo.width, (h * 0.3) / logo.height);
  const dW = logo.width * ratio;
  const dH = logo.height * ratio;
  ctx.drawImage(logo, -dW / 2, -dH / 2, dW, dH);
}

/** Same flat color as the front, one short accent stroke: nothing that says "playing card". */
function paintMinimalBack(rc: RenderContext, w: number, h: number, r: number, p: Palette) {
  const { ctx } = rc;
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = p.bgTop;
  ctx.fill();
  ctx.fillStyle = p.ornament;
  roundRect(ctx, -36, -2.5, 72, 5, 2.5);
  ctx.fill();
}

function paintFront(
  rc: RenderContext,
  item: ItemContent,
  w: number,
  h: number,
  r: number,
  p: Palette,
  sheen: number,
  textAlpha = 1,
) {
  const { ctx, style } = rc;
  const accent = p.ornament;
  const k = style.textScale;
  const badge = cased(rc, item.badge);
  const num = cased(rc, item.number);
  const title = cased(rc, item.title) || 'CARTE';
  const body = cased(rc, item.body);
  const footer = cased(rc, item.footer);

  const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  grad.addColorStop(0, p.bgTop);
  grad.addColorStop(1, p.bgBottom);
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = p.outerBorder;
  ctx.lineWidth = 6;
  ctx.stroke();

  ctx.save();
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.clip();

  if (style.variant === 'neon-arcade') {
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
    ctx.lineWidth = 1.5;
    for (let x = -w / 2; x < w / 2; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, -h / 2);
      ctx.lineTo(x, h / 2);
      ctx.stroke();
    }
    for (let y = -h / 2; y < h / 2; y += 36) {
      ctx.beginPath();
      ctx.moveTo(-w / 2, y);
      ctx.lineTo(w / 2, y);
      ctx.stroke();
    }
  }

  const inset = 20;
  ctx.strokeStyle = p.innerBorder;
  ctx.lineWidth = 2.5;
  roundRect(ctx, -w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, r - 10);
  ctx.stroke();

  ctx.fillStyle = accent;
  for (const [cx, cy] of [
    [-w / 2 + 34, -h / 2 + 34],
    [w / 2 - 34, -h / 2 + 34],
    [-w / 2 + 34, h / 2 - 34],
    [w / 2 - 34, h / 2 - 34],
  ] as const) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }

  const topBarY = -h / 2 + 64;
  if (badge) {
    ctx.save();
    ctx.font = interFont(800, 18);
    setLetterSpacing(ctx, 2.5);
    const bW = Math.min(w - 175, ctx.measureText(badge).width + 34);
    const bX = -w / 2 + 42;
    roundRect(ctx, bX, topBarY - 19, bW, 38, 12);
    ctx.fillStyle = p.badgeBg;
    ctx.fill();
    ctx.fillStyle = p.badgeText;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge, bX + 16, topBarY + 1, bW - 28);
    ctx.restore();
  }
  if (num) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2 - 66, topBarY, 26, 0, Math.PI * 2);
    ctx.fillStyle = p.badgeBg;
    ctx.fill();
    ctx.fillStyle = p.badgeText;
    ctx.font = interFont(900, num.length > 3 ? 16 : 20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(num, w / 2 - 66, topBarY + 1);
    ctx.restore();
  }

  if (textAlpha > 0) {
    ctx.save();
    ctx.globalAlpha *= textAlpha;
    // Title sits at the vertical center of the card; the brand logo (when placed "above text") goes above it.
    let titleSize = Math.round(46 * k * (style.fontId === 'bebas-neue' ? 1.18 : 1));
    ctx.font = titleFont(rc, 900, titleSize);
    const measured = ctx.measureText(title).width;
    if (measured > w - 76 && measured > 0) titleSize = Math.floor(titleSize * ((w - 76) / measured));
    const titleY = body ? -44 : -20;

    const logo = rc.logo.image;
    if (logo && rc.style.logo.show && rc.style.logo.placement === 'above-text') {
      const zoneTop = topBarY + 46;
      const zoneBottom = titleY - titleSize * 0.6 - 30;
      const zoneH = zoneBottom - zoneTop;
      const size = Math.min(1.2, rc.style.logo.size);
      const ratio = Math.min(((w - 140) * size) / logo.width, (zoneH * 0.8 * size) / logo.height);
      const dW = logo.width * ratio;
      const dH = logo.height * ratio;
      ctx.save();
      ctx.globalAlpha *= rc.style.logo.opacity;
      ctx.drawImage(logo, -dW / 2, zoneTop + (zoneH - dH) / 2, dW, dH);
      ctx.restore();
    }

    ctx.save();
    ctx.font = titleFont(rc, 900, titleSize);
    ctx.fillStyle = p.titleColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 0, titleY);
    const sepY = titleY + titleSize * 0.68;
    ctx.fillStyle = accent;
    roundRect(ctx, -36, sepY, 72, 5, 2.5);
    ctx.fill();
    ctx.restore();

    if (body) {
      const bodySize = Math.round(23 * Math.min(1.2, k));
      ctx.save();
      ctx.font = interFont(500, bodySize);
      ctx.fillStyle = p.bodyColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      wrapBelow(rc, body, sepY + 48, w - 84, bodySize * 1.38, 4);
      ctx.restore();
    }
    ctx.restore();
  }

  const footerY = h / 2 - 42;
  ctx.save();
  ctx.strokeStyle = hexToRgba(accent, 0.25);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 44, footerY - 22);
  ctx.lineTo(w / 2 - 44, footerY - 22);
  ctx.stroke();
  if (footer) {
    ctx.font = interFont(700, 15);
    setLetterSpacing(ctx, 3);
    ctx.fillStyle = p.footerColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(footer, 0, footerY + 2, w - 80);
  }
  ctx.restore();

  if (sheen >= 0 && sheen <= 1) {
    ctx.save();
    const sx = -w * 1.1 + sheen * w * 2.2;
    const g = ctx.createLinearGradient(sx - 110, -h / 2, sx + 110, h / 2);
    g.addColorStop(0, 'rgba(255, 255, 255, 0)');
    g.addColorStop(0.45, 'rgba(255, 255, 255, 0.14)');
    g.addColorStop(0.5, 'rgba(255, 255, 255, 0.34)');
    g.addColorStop(0.55, 'rgba(255, 255, 255, 0.14)');
    g.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  ctx.restore();
}

function cardShadow(
  rc: RenderContext,
  w: number,
  h: number,
  r: number,
  color: string,
  blur: number,
  offX: number,
  offY: number,
) {
  const { ctx, scale: S } = rc;
  ctx.save();
  ctx.shadowColor = color;
  // Shadows ignore the transform: scale them by hand.
  ctx.shadowBlur = blur * S;
  ctx.shadowOffsetX = offX * S;
  ctx.shadowOffsetY = offY * S;
  roundRect(ctx, -w / 2, -h / 2, w, h, r);
  ctx.fillStyle = '#000000';
  ctx.fill();
  ctx.restore();
}

export function cardPhases(duration: number) {
  return { inEnd: Math.min(0.95, duration * 0.28), outStart: duration - Math.min(0.6, duration * 0.2) };
}

/** A playing card that appears with one of 4 "3D" moves. */
export function drawPlayingCard(rc: RenderContext, item: ItemContent): void {
  const { ctx, width: W, height: H, time: t, duration, scale: S, portrait, style } = rc;
  const cx = W / 2;
  const cy = H / 2;
  const enterRaw = clamp(t / Math.min(0.95, duration * 0.28));
  const exitLength = Math.min(0.6, duration * 0.2);
  const exitRaw = t > duration - exitLength ? clamp((t - (duration - exitLength)) / exitLength) : 0;
  const easeIn = easeOutExpo(enterRaw);
  const easeOut = easeInCubic(exitRaw);
  const exitAlpha = 1 - easeOut;

  if (isWatermark(rc)) drawLogo(rc);
  if (exitAlpha <= 0.001) return;

  const w = portrait ? 540 : 510;
  const h = portrait ? 760 : 720;
  const r = 34;
  const p = cardPalette(style.variant, style.accent, style.textColor);
  const anim = rc.animation.style;
  const back = CARD_BACKS.some((b) => b.id === item.back) ? item.back! : CARD_BACKS[0]!.id;
  const sheenAt = (start: number, length: number) => {
    const s = clamp((t - start) / length);
    return s > 0 && s < 1 ? s : -1;
  };

  ctx.save();
  ctx.globalAlpha = exitAlpha;

  if (anim === 'zoom-intertitle') {
    drawZoomIntertitle(rc, item, w, h, r, p, back, exitAlpha);
    ctx.restore();
    return;
  }

  if (anim === 'deal-slide') {
    const dealT = easeOutBack(clamp(t / Math.min(0.78, duration * 0.25)));
    const slideX = ((1 - dealT) * (portrait ? 480 : 720) - easeOut * 650) * S;
    const slideY = ((1 - dealT) * 260 + easeOut * 180) * S;
    const rot = (1 - dealT) * 0.42 - easeOut * 0.35 + Math.sin(t * 2.2) * 0.01;
    const zoom = (0.78 + 0.22 * easeIn) * (1 - easeOut * 0.1);
    ctx.translate(cx + slideX, cy + slideY);
    ctx.rotate(rot);
    ctx.scale(zoom * S, zoom * S);
    cardShadow(rc, w, h, r, 'rgba(0, 0, 0, 0.55)', 42, 0, 22);
    paintFront(rc, item, w, h, r, p, sheenAt(0.55, 0.8));
  } else if (anim === 'fan-snap') {
    const fanT = easeOutBack(clamp(t / Math.min(0.85, duration * 0.26)));
    const snapT = easeOutExpo(clamp((t - 0.12) / 0.65));
    const open = fanT * (1 - easeOut);
    [-1, 1].forEach((side) => {
      ctx.save();
      ctx.globalAlpha = exitAlpha * 0.88 * easeIn;
      ctx.translate(cx + side * 95 * open * S, cy + (18 + (1 - easeIn) * 80) * S);
      ctx.rotate(side * 0.22 * open);
      ctx.scale(0.92 * S, 0.92 * S);
      cardShadow(rc, w, h, r, 'rgba(0, 0, 0, 0.45)', 24, 0, 12);
      paintBack(rc, w, h, r, p, back);
      ctx.restore();
    });
    const zoom = (0.76 + 0.24 * snapT) * (1 - easeOut * 0.1);
    ctx.translate(cx, cy + ((1 - snapT) * 70 + easeOut * 90) * S);
    ctx.scale(zoom * S, zoom * S);
    cardShadow(rc, w, h, r, 'rgba(0, 0, 0, 0.62)', 48, 0, 26);
    paintFront(rc, item, w, h, r, p, sheenAt(0.55, 0.85));
  } else if (anim === 'holo-float') {
    const floatY = Math.sin(t * 2.8) * 14;
    const tilt = Math.sin(t * 2.1) * 0.035;
    const skew = 1 - Math.abs(Math.cos(t * 2.1)) * 0.04;
    const zoom = (0.85 + 0.15 * easeIn) * (1 - easeOut * 0.1);
    const loopSheen = (t * 0.55) % 1.4;
    ctx.translate(cx, cy + (floatY + (1 - easeIn) * 60 + easeOut * 80) * S);
    ctx.rotate(tilt);
    ctx.scale(zoom * skew * S, zoom * S);
    cardShadow(rc, w, h, r, hexToRgba(style.accent, 0.45), 55, 0, 0);
    paintFront(rc, item, w, h, r, p, loopSheen <= 1 ? loopSheen : -1);
  } else {
    // card-flip-3d (default)
    const flipT = easeInOutCubic(clamp(t / Math.min(1.05, duration * 0.32)));
    const angle = Math.PI * (1 - flipT);
    const cos = Math.cos(angle);
    const lift = 0.82 + 0.18 * easeIn + Math.sin(flipT * Math.PI) * 0.09 - easeOut * 0.12;
    const tilt = Math.sin(flipT * Math.PI) * -0.06 + Math.sin(t * 2) * 0.012;
    ctx.translate(cx, cy + ((1 - easeIn) * 90 + easeOut * 110) * S);
    ctx.rotate(tilt);
    ctx.scale(Math.max(0.02, Math.abs(cos)) * lift * S, lift * S);
    cardShadow(rc, w, h, r, 'rgba(0, 0, 0, 0.58)', 45, Math.sin(angle) * 28, 24);
    if (cos >= 0) paintFront(rc, item, w, h, r, p, sheenAt(0.65, 0.85));
    else paintBack(rc, w, h, r, p, back);
  }
  ctx.restore();

  if (!isWatermark(rc) && style.logo.placement !== 'above-text') {
    drawLogo(rc, { topY: cy - (h / 2) * S, badgeLeftX: cx - (w / 2) * S, badgeY: cy - (h / 2 - 50) * S });
  }
}

/** Timings of "Zoom & intertitre" (seconds, shortened on short clips). */
function zoomTimings(duration: number) {
  const k = Math.min(1, duration / 5.5);
  return {
    appear: 0.45 * k,
    flipStart: 0.9 * k,
    flipEnd: 1.5 * k,
    zoomStart: 2.0 * k,
    zoomEnd: 2.7 * k,
    textFade: 0.25 * k,
    text: 2.5 * k,
  };
}

/**
 * The card pops in face down in the middle of the frame, flips to show its front (title included),
 * zooms until it fills the frame, then the title and question come in the middle exactly like a
 * chapter intertitle (slide & mask).
 */
function drawZoomIntertitle(
  rc: RenderContext,
  item: ItemContent,
  w: number,
  h: number,
  r: number,
  p: Palette,
  back: string,
  exitAlpha: number,
) {
  const { ctx, width: W, height: H, time: t, duration, scale: S } = rc;
  const tm = zoomTimings(duration);
  const appearT = easeOutBack(clamp(t / tm.appear));
  const flipT = easeInOutCubic(clamp((t - tm.flipStart) / (tm.flipEnd - tm.flipStart)));
  const zoomT = easeInOutCubic(clamp((t - tm.zoomStart) / (tm.zoomEnd - tm.zoomStart)));
  const cardText = 1 - clamp((t - tm.zoomStart) / tm.textFade);
  // Big enough for the badge, medallion, footer and inner frame to leave the picture on every format.
  const fill = Math.max(W / ((w - 120) * S), H / ((h - 200) * S)) * 1.08;
  const zoom = (0.7 + 0.3 * appearT) * (1 + (fill - 1) * zoomT);
  const cos = Math.cos(Math.PI * (1 - flipT));

  ctx.save();
  // The card dissolves at the end of the zoom: only the text stays, over the video.
  const dissolve = 1 - clamp((t - (tm.zoomStart + tm.zoomEnd) / 2) / (tm.zoomEnd - tm.zoomStart));
  ctx.globalAlpha = exitAlpha * clamp(t / (tm.appear * 0.5)) * dissolve;
  ctx.translate(W / 2, H / 2);
  ctx.scale(Math.max(0.02, Math.abs(cos)) * zoom * S, zoom * S);
  if (zoomT < 1) cardShadow(rc, w, h, r, 'rgba(0, 0, 0, 0.55)', 42, 0, 22);
  if (cos >= 0) paintFront(rc, item, w, h, r, p, -1, cardText);
  else paintBack(rc, w, h, r, p, back);
  ctx.restore();

  if (t < tm.text) return;
  drawChapterTitle(
    {
      ...rc,
      time: t - tm.text,
      duration: duration - tm.text,
      style: { ...rc.style, logo: { ...rc.style.logo, show: false } },
      animation: {
        ...rc.animation,
        style: CARD_TEXT_ANIMATIONS.some((a) => a.id === item.textAnim) ? item.textAnim! : 'slide-mask',
      },
    },
    {
      kicker: item.badge ?? '',
      title: item.title ?? '',
      subtitle: item.body ?? '',
    },
  );
}
