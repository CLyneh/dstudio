import type { Ctx2D } from './types';

/**
 * - transparent: nothing (export with alpha)
 * - checker: grey checkerboard, preview of transparency
 * - scene: built-in demo "video frame" so beginners judge readability
 * - image: a still the user dropped from their own video
 * - black / green: solid fills (green = chroma key)
 */
export type BackgroundMode = 'transparent' | 'checker' | 'scene' | 'image' | 'black' | 'green';

export type BackgroundImage = CanvasImageSource & { width: number; height: number };

export function drawBackground(
  ctx: Ctx2D,
  width: number,
  height: number,
  mode: BackgroundMode,
  time: number,
  image?: BackgroundImage | null,
): void {
  switch (mode) {
    case 'transparent':
      return;
    case 'black':
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      return;
    case 'green':
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(0, 0, width, height);
      return;
    case 'checker':
      drawChecker(ctx, width, height);
      return;
    case 'image':
      if (image) {
        drawCover(ctx, image, width, height);
        return;
      }
      drawScene(ctx, width, height, time);
      return;
    case 'scene':
      drawScene(ctx, width, height, time);
  }
}

function drawChecker(ctx: Ctx2D, width: number, height: number): void {
  const cell = Math.max(12, Math.round(Math.min(width, height) / 30));
  ctx.fillStyle = '#16181f';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#23262f';
  for (let y = 0, row = 0; y < height; y += cell, row++) {
    for (let x = row % 2 ? cell : 0; x < width; x += cell * 2) ctx.fillRect(x, y, cell, cell);
  }
}

function drawCover(ctx: Ctx2D, image: BackgroundImage, width: number, height: number): void {
  const scale = Math.max(width / image.width, height / image.height);
  const w = image.width * scale;
  const h = image.height * scale;
  ctx.drawImage(image, (width - w) / 2, (height - h) / 2, w, h);
}

/** A sunset over an office skyline: busy enough to test readability. */
function drawScene(ctx: Ctx2D, width: number, height: number, time: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#2a3552');
  sky.addColorStop(0.55, '#a76a5c');
  sky.addColorStop(1, '#3a2a2e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  const sx = width * (0.68 + Math.sin(time * 0.15) * 0.02);
  const sy = height * 0.5;
  const sun = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.min(width, height) * 0.5);
  sun.addColorStop(0, 'rgba(255, 214, 160, 0.85)');
  sun.addColorStop(1, 'rgba(255, 214, 160, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(30, 22, 30, 0.75)';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.66);
  for (let i = 0; i <= 8; i++) ctx.lineTo((width * i) / 8, height * (0.62 + 0.05 * Math.sin(i * 1.7)));
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  ctx.fillStyle = 'rgba(15, 12, 18, 0.85)';
  ctx.fillRect(0, height * 0.8, width, height * 0.2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
  ctx.fillRect(0, 0, width, height);
}
