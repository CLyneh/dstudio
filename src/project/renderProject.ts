import { drawBackdrop } from '@/engine/backdrop';
import { drawBackground, type BackgroundImage, type BackgroundMode } from '@/engine/backgrounds';
import { designScale } from '@/engine/formats';
import { itemAt } from '@/engine/timing';
import type { Ctx2D, ItemContent, LogoSource } from '@/engine/types';
import { getTemplate } from '@/templates/registry';
import type { Project } from './project';

export interface FrameOptions {
  background: BackgroundMode;
  backgroundImage?: BackgroundImage | null;
  logo: LogoSource;
}

/** Draws one item of a project at `localTime` seconds into that item. Used by export. */
export function renderItemFrame(
  ctx: Ctx2D,
  width: number,
  height: number,
  project: Project,
  item: ItemContent,
  localTime: number,
  options: FrameOptions,
  /** Time used to move the demo background; defaults to localTime. */
  sceneTime = localTime,
): void {
  const template = getTemplate(project.templateId);
  // Like the original studio, never sample exactly the last instant (everything has faded out).
  const t = Math.min(Math.max(0, localTime), Math.max(0.001, project.duration - 0.0001));
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, options.background, sceneTime, options.backgroundImage);
  drawBackdrop(ctx, width, height, project.style, t, project.duration);
  template.render(
    {
      ctx,
      width,
      height,
      scale: designScale(width, height),
      time: t,
      duration: project.duration,
      style: project.style,
      animation: project.animation,
      logo: options.logo,
      portrait: height >= width,
      shadows: options.background !== 'green',
    },
    item,
  );
  ctx.restore();
}

/** Draws the whole project at `time` (items back to back). Used by the preview. */
export function renderProjectFrame(
  ctx: Ctx2D,
  width: number,
  height: number,
  project: Project,
  time: number,
  options: FrameOptions,
): void {
  const template = getTemplate(project.templateId);
  const items = template.items(project.content);
  const { index, localTime } = itemAt(time, project.duration, items.length);
  renderItemFrame(ctx, width, height, project, items[index] ?? {}, localTime, options, time);
}
