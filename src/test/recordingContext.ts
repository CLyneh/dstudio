import type { Ctx2D } from '@/engine/types';

export interface DrawnText {
  text: string;
  x: number;
  y: number;
  alpha: number;
}

/**
 * A fake 2D context that records drawn text and never throws.
 * Lets unit tests check what a template draws, without a real canvas.
 */
export function createRecordingContext(charWidth = 10) {
  const texts: DrawnText[] = [];
  const stack: number[] = [];
  let alpha = 1;
  const gradient = { addColorStop: () => undefined };
  const target: Record<string, unknown> = {
    font: '',
    fillStyle: '#000',
    strokeStyle: '#000',
    textAlign: 'left',
    textBaseline: 'alphabetic',
    lineWidth: 1,
    letterSpacing: '0px',
    measureText: (s: string) => ({ width: s.length * charWidth }),
    fillText: (text: string, x: number, y: number) => texts.push({ text, x, y, alpha }),
    save: () => stack.push(alpha),
    restore: () => {
      alpha = stack.pop() ?? 1;
    },
    createLinearGradient: () => gradient,
    createRadialGradient: () => gradient,
  };
  Object.defineProperty(target, 'globalAlpha', {
    get: () => alpha,
    set: (v: number) => {
      alpha = v;
    },
  });
  const ctx = new Proxy(target, {
    get: (t, key: string) => (key in t ? t[key] : () => undefined),
    set: (t, key: string, value) => {
      t[key] = value;
      return true;
    },
  }) as unknown as Ctx2D;
  return { ctx, texts };
}
