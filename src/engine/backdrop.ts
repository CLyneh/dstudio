import { easeInCubic, easeOutExpo } from './easing';
import { clamp } from './math';
import type { Ctx2D, StyleSettings } from './types';

/** Black veil and vignette over the video, fading in and out with the clip (exported with the overlay). */
export function drawBackdrop(
  ctx: Ctx2D,
  width: number,
  height: number,
  style: StyleSettings,
  time: number,
  duration: number,
): void {
  const enter = easeOutExpo(clamp(time / 0.45));
  const exitLength = Math.min(0.55, duration * 0.2);
  const exitRaw = time > duration - exitLength ? clamp((time - (duration - exitLength)) / exitLength) : 0;
  const envelope = enter * (1 - easeInCubic(exitRaw));

  if (style.veil > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${style.veil * envelope})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
  if (style.vignette) {
    ctx.save();
    const radius = Math.max(width, height) * 0.72;
    const grad = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * 0.35,
      width / 2,
      height / 2,
      radius,
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, `rgba(0, 0, 0, ${0.65 * envelope})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
