import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { clamp } from '@/engine/math';

export const PREVIEW_FPS = 30;

export interface Playback {
  /** Current preview time in seconds (a ref: updated every frame without re-rendering React). */
  timeRef: React.MutableRefObject<number>;
  playing: boolean;
  loop: boolean;
  setPlaying(playing: boolean): void;
  toggle(): void;
  setLoop(loop: boolean): void;
  seek(time: number): void;
  stepFrames(frames: number): void;
}

export function usePlayback(total: number): Playback {
  const timeRef = useRef(0);
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [playing, setPlaying] = useState(!reduced);
  const [loop, setLoop] = useState(true);
  const totalRef = useRef(total);
  useLayoutEffect(() => {
    totalRef.current = total;
  }, [total]);

  const seek = useCallback((time: number) => {
    timeRef.current = clamp(time, 0, totalRef.current);
  }, []);
  const stepFrames = useCallback(
    (frames: number) => {
      setPlaying(false);
      seek(timeRef.current + frames / PREVIEW_FPS);
    },
    [seek],
  );
  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && timeRef.current >= totalRef.current) timeRef.current = 0;
      return !p;
    });
  }, []);

  return useMemo(
    () => ({ timeRef, playing, loop, setPlaying, toggle, setLoop, seek, stepFrames }),
    [playing, loop, toggle, seek, stepFrames],
  );
}
