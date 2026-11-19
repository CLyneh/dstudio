import { easeInCubic, easeOutExpo } from './easing';
import { clamp } from './math';
import type { LogoMotion, LogoPlacement, RenderContext } from './types';

export const LOGO_PLACEMENTS: readonly { id: LogoPlacement; label: string }[] = [
  { id: 'above-text', label: 'Au-dessus du texte' },
  { id: 'beside-badge', label: "À côté de l'étiquette" },
  { id: 'center-watermark', label: 'Filigrane en fond' },
  { id: 'top-corner', label: 'Coin haut-gauche' },
];

export const LOGO_MOTIONS: readonly { id: LogoMotion; label: string }[] = [
  { id: 'scale-in', label: 'Fondu & zoom' },
  { id: 'slide', label: 'Glissement vertical' },
  { id: 'float', label: 'Flottement doux' },
  { id: 'pulse', label: 'Pulsation' },
  { id: 'tilt-spin', label: 'Rotation subtile' },
  { id: 'none', label: 'Statique' },
];

/** Where the text block is, so the logo can sit above it or beside its label. */
export interface LogoAnchor {
  topY?: number;
  badgeLeftX?: number;
  badgeY?: number;
}

/** Draws the brand logo with its placement and motion (nothing when there is no logo image). */
export function drawLogo(rc: RenderContext, anchor: LogoAnchor | null = null): void {
  const { ctx, width: W, height: H, time, duration, scale: S, portrait } = rc;
  const settings = rc.style.logo;
  const img = rc.logo.image;
  if (!settings.show || !img || img.width === 0) return;

  const enterDur = Math.min(0.65, duration * 0.25);
  const exitDur = Math.min(0.55, duration * 0.22);
  const exitStart = duration - exitDur;
  const easeIn = easeOutExpo(clamp(time / enterDur));
  const easeOut = easeInCubic(time > exitStart ? clamp((time - exitStart) / exitDur) : 0);
  if (easeIn * (1 - easeOut) <= 0.001) return;

  const maxDim = (portrait ? 210 : 230) * S * settings.size;
  const aspect = img.width / img.height;
  let w = aspect >= 1 ? maxDim : maxDim * aspect;
  let h = aspect >= 1 ? maxDim / aspect : maxDim;

  let x = W / 2;
  let y = H / 2;
  switch (settings.placement) {
    case 'above-text':
      y =
        anchor?.topY !== undefined
          ? Math.max(h / 2 + 50 * S, anchor.topY - h / 2 - 36 * S)
          : H * (portrait ? 0.3 : 0.25);
      break;
    case 'beside-badge':
      if (anchor?.badgeLeftX !== undefined && anchor.badgeY !== undefined) {
        x = Math.max(w / 2 + 40 * S, anchor.badgeLeftX - w / 2 - 24 * S);
        y = anchor.badgeY;
      } else {
        x = W * 0.22;
        y = H * 0.22;
      }
      break;
    case 'center-watermark':
      w *= 2.1;
      h *= 2.1;
      break;
    case 'top-corner': {
      const margin = (portrait ? 85 : 95) * S;
      x = margin + w / 2;
      y = margin + h / 2;
      break;
    }
  }

  let scale = 1;
  let offsetY = 0;
  let rotation = 0;
  let alpha = settings.opacity * (1 - easeOut);
  const motion = settings.motion;
  if (motion !== 'none') alpha *= easeIn;
  if (motion === 'scale-in') scale = 0.72 + 0.28 * easeIn;
  else if (motion === 'slide') offsetY = ((1 - easeIn) * -70 - easeOut * 40) * S;
  else if (motion === 'float') offsetY = Math.sin(time * 3.2) * 14 * S;
  else if (motion === 'pulse') scale = 1 + Math.sin(time * 4.5) * 0.065;
  else if (motion === 'tilt-spin') {
    scale = 0.85 + 0.15 * easeIn;
    rotation = Math.sin(time * 2.4) * 0.12 + (1 - easeIn) * -0.25;
  }

  ctx.save();
  ctx.globalAlpha = clamp(alpha);
  ctx.translate(x, y + offsetY);
  ctx.rotate(rotation);
  ctx.scale(scale, scale);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Draw the logo behind (watermark) or after (other placements) the text. */
export function isWatermark(rc: RenderContext): boolean {
  return rc.style.logo.placement === 'center-watermark';
}
