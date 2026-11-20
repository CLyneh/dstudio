import type { Ctx2D } from './types';

/** Vertical formats: areas covered by the Instagram / TikTok interface (fractions of the frame). */
export const VERTICAL_UNSAFE = {
  top: 0.12,
  bottom: 0.22,
  right: 0.16,
} as const;

/** Overlay shown in the preview only, never exported. */
export function drawSafeZones(ctx: Ctx2D, width: number, height: number): void {
  ctx.save();
  if (height > width) {
    // Light dashed outline of the visible area: the picture behind stays readable.
    const { top, bottom, right } = VERTICAL_UNSAFE;
    ctx.setLineDash([10, 7]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 93, 98, 0.9)';
    ctx.strokeRect(1, height * top, width * (1 - right), height * (1 - top - bottom));
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `700 ${Math.round(width / 38)}px Manrope, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText("Caché par l'interface Instagram / TikTok", width / 2, height * 0.07);
    ctx.fillText('Légende, boutons, nom du compte', width / 2, height * 0.9);
  } else {
    ctx.setLineDash([8, 6]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.85)';
    ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);
    ctx.setLineDash([]);
    ctx.font = `600 ${Math.round(height / 40)}px Manrope, sans-serif`;
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('Zone image', width * 0.05 + 6, height * 0.05 + height / 32);
    ctx.fillStyle = 'rgba(242, 193, 78, 0.95)';
    ctx.fillText('Zone texte', width * 0.1 + 6, height * 0.1 + height / 32);
  }
  ctx.restore();
}
