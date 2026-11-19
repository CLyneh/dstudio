import { useEffect, useMemo, useState } from 'react';
import type { LogoSource } from '@/engine/types';
import { useStore } from '@/state/store';

/** Decodes a data: URL into an image usable on a canvas (null while loading or when absent). */
export function useImage(src: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ src: string; image: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    const img = new Image();
    img.onload = () => {
      if (alive) setLoaded({ src, image: img });
    };
    img.src = src;
    return () => {
      alive = false;
    };
  }, [src]);
  return src && loaded?.src === src ? loaded.image : null;
}

/** The brand logo, ready for the renderer. */
export function useLogo(): LogoSource {
  const logoDataUrl = useStore((s) => s.brand.logoDataUrl);
  const image = useImage(logoDataUrl);
  return useMemo(() => ({ image }), [image]);
}
