import { useEffect, useRef } from 'react';
import type { BackgroundMode } from '@/engine/backgrounds';
import { previewSize } from '@/engine/formats';
import { useLogo } from '@/ui/hooks/useLogo';
import { projectTotalDuration, type Project } from '@/project/project';
import { renderProjectFrame } from '@/project/renderProject';
import { getTemplate } from '@/templates/registry';

interface Props {
  project: Project;
  /** Loop the animation (home cards) or draw one still (lists). */
  animate: boolean;
  maxSide?: number;
  background?: BackgroundMode;
  className?: string;
  label?: string;
}

const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Small read-only render of a project: template cards, creation thumbnails. */
export function ProjectCanvas({
  project,
  animate,
  maxSide = 480,
  background = 'scene',
  className,
  label,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const logo = useLogo();
  const { width, height } = previewSize(project.format, maxSide);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const total = projectTotalDuration(project);
    const still = Math.min(
      getTemplate(project.templateId).phases(project.duration).inEnd + 0.4,
      total - 0.05,
    );
    const draw = (t: number) => renderProjectFrame(ctx, width, height, project, t, { background, logo });

    if (!animate || reducedMotion()) {
      draw(still);
      return;
    }
    let frame = 0;
    let visible = true;
    const offset = Math.random() * 1.5;
    const observer = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
    });
    observer.observe(canvas);
    const loop = (now: number) => {
      if (visible && !document.hidden) draw(((now / 1000 + offset) % (total + 0.6)) as number);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [project, animate, width, height, background, logo]);

  return (
    <canvas ref={ref} width={width} height={height} className={className} aria-label={label} role="img" />
  );
}
