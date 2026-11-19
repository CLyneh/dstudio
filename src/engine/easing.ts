/** Easing curves (same as the original Motion Studio v2). Input in [0, 1]. */

export function easeOutExpo(x: number): number {
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutQuint(x: number): number {
  return 1 - Math.pow(1 - x, 5);
}

export function easeInOutCubic(x: number): number {
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function easeInCubic(x: number): number {
  return x * x * x;
}
