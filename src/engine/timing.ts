import { easeInCubic } from './easing';
import { clamp } from './math';

/** Progress of a step starting at `start` and lasting `length` seconds, clamped to [0, 1]. */
export function stepProgress(time: number, start: number, length: number): number {
  return clamp((time - start) / length);
}

/**
 * Exit of a clip: lasts min(maxExit, duration × fraction) at the very end.
 * `out` goes 0 → 1 (eased), `raw` is linear.
 */
export function exitProgress(
  time: number,
  duration: number,
  maxExit: number,
  fraction: number,
): { raw: number; out: number; start: number } {
  const length = Math.min(maxExit, duration * fraction);
  const start = duration - length;
  const raw = time > start ? clamp((time - start) / length) : 0;
  return { raw, out: easeInCubic(raw), start };
}

/** For multi-item clips (series, batch): which item is on screen at `time`. */
export function itemAt(time: number, perItem: number, count: number): { index: number; localTime: number } {
  const safeCount = Math.max(1, count);
  const index = Math.min(safeCount - 1, Math.max(0, Math.floor(time / perItem)));
  return { index, localTime: time - index * perItem };
}

/** Formats seconds as MM:SS:FF (frames), like an editing timecode. */
export function formatTimecode(seconds: number, fps = 30): string {
  const s = Math.max(0, seconds);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const f = Math.min(fps - 1, Math.floor((s % 1) * fps));
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(m)}:${p(sec)}:${p(f)}`;
}
