export type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export type TextCase = 'normal' | 'upper' | 'lower' | 'title';
export type Position = 'left' | 'center' | 'right';
export type LogoPlacement = 'above-text' | 'beside-badge' | 'center-watermark' | 'top-corner';
export type LogoMotion = 'scale-in' | 'slide' | 'float' | 'pulse' | 'tilt-spin' | 'none';

export interface LogoSettings {
  show: boolean;
  placement: LogoPlacement;
  motion: LogoMotion;
  /** 1 = 100 %. */
  size: number;
  opacity: number;
}

export interface StyleSettings {
  /** Template-specific visual variant (lower third card style, playing card finish…). */
  variant: string;
  accent: string;
  textColor: string;
  fontId: string;
  textCase: TextCase;
  /** 1 = 100 %. */
  textScale: number;
  position: Position;
  /** Black veil over the video, 0 → 0.85. */
  veil: number;
  vignette: boolean;
  /** Vertical formats: raise lower thirds above the Reels / TikTok interface. */
  safeVertical: boolean;
  logo: LogoSettings;
}

export interface AnimationSettings {
  /** Template-specific animation id. */
  style: string;
}

export interface LogoSource {
  image: (CanvasImageSource & { width: number; height: number }) | null;
}

/** Everything a template needs to draw one frame of one item. */
export interface RenderContext {
  ctx: Ctx2D;
  width: number;
  height: number;
  /** Pixel factor: designs are drawn for a frame whose short side is 1080 px. */
  scale: number;
  /** Seconds since the start of this item. */
  time: number;
  /** Length of this item, in seconds. */
  duration: number;
  style: StyleSettings;
  animation: AnimationSettings;
  logo: LogoSource;
  /** Vertical-style layout (9:16, 4:5, 1:1). */
  portrait: boolean;
  /** Soft text shadows (off on a green background so keying stays clean). */
  shadows: boolean;
}

/** Text values of one item, keyed by template field. */
export type ItemContent = Record<string, string>;
