import { zipSync } from 'fflate';
import type { BackgroundMode } from '@/engine/backgrounds';
import { ensureFontsLoaded } from '@/engine/fonts';
import { getFormat } from '@/engine/formats';
import type { LogoSource } from '@/engine/types';
import { projectTotalDuration, type Project } from '@/project/project';
import { renderItemFrame, renderProjectFrame } from '@/project/renderProject';
import { frameFileName } from './fileNames';
import { encodeFrames } from './ffmpeg';
import { planExport } from './plan';
import type { EditingApp, ExportBackground, SeriesMode } from './targets';

export { planExport };

export interface ExportRequest {
  project: Project;
  app: EditingApp;
  background: ExportBackground;
  fps: number;
  seriesMode: SeriesMode;
  logo: LogoSource;
  signal?: AbortSignal;
  onProgress?: (progress: ExportProgress) => void;
}

export interface ExportProgress {
  /** 0 → 1 for the whole export. */
  ratio: number;
  label: string;
}

export interface ExportResult {
  blob: Blob;
  fileName: string;
  /** Number of clips inside (1 unless zipped). */
  clipCount: number;
}

export class ExportCancelled extends Error {
  constructor() {
    super('Export annulé');
  }
}

/** One clip to render: draws frame `t` (seconds) on the canvas. */
interface ClipJob {
  fileName: string;
  duration: number;
  draw: (ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D, t: number) => void;
}

const BACKGROUND_MODE: Record<ExportBackground, BackgroundMode> = {
  alpha: 'transparent',
  black: 'black',
  green: 'green',
};

function createCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    return { canvas, ctx: canvas.getContext('2d', { alpha: true }) as OffscreenCanvasRenderingContext2D };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext('2d', { alpha: true }) as CanvasRenderingContext2D };
}

async function toPng(canvas: OffscreenCanvas | HTMLCanvasElement): Promise<Uint8Array> {
  const blob =
    'convertToBlob' in canvas
      ? await canvas.convertToBlob({ type: 'image/png' })
      : await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encoding failed'))), 'image/png'),
        );
  return new Uint8Array(await blob.arrayBuffer());
}

export async function exportProject(request: ExportRequest): Promise<ExportResult> {
  const { project, app, background, fps, seriesMode, logo, signal, onProgress } = request;
  const plan = planExport(project, app, background, seriesMode);
  const { width, height } = getFormat(project.format);
  const options = { background: BACKGROUND_MODE[background], logo };
  const report = (ratio: number, label: string) => onProgress?.({ ratio: Math.min(1, ratio), label });
  const checkAbort = () => {
    if (signal?.aborted) throw new ExportCancelled();
  };

  report(0, 'Préparation…');
  await ensureFontsLoaded();

  const jobs: ClipJob[] = plan.single
    ? [
        {
          fileName: plan.clipNames[0] as string,
          duration: projectTotalDuration(project),
          draw: (ctx, t) => renderProjectFrame(ctx, width, height, project, t, options),
        },
      ]
    : plan.items.map((item, i) => ({
        fileName: plan.clipNames[i] as string,
        duration: project.duration,
        draw: (ctx, t) => renderItemFrame(ctx, width, height, project, item, t, options),
      }));

  const { canvas, ctx } = createCanvas(width, height);
  const outputs: Record<string, Uint8Array> = {};
  const share = 1 / jobs.length;

  for (const [jobIndex, job] of jobs.entries()) {
    const frameCount = Math.max(1, Math.round(job.duration * fps));
    const base = job.fileName.replace(/\.[a-z0-9]+$/, '');
    const start = jobIndex * share;
    const renderShare = plan.codec.id === 'png' ? share : share * 0.5;
    const frames: Uint8Array[] = [];
    const clipLabel = jobs.length > 1 ? ` (${jobIndex + 1}/${jobs.length})` : '';

    for (let f = 0; f < frameCount; f++) {
      checkAbort();
      job.draw(ctx, f / fps);
      const png = await toPng(canvas);
      if (plan.codec.id === 'png') outputs[frameFileName(base, f)] = png;
      else frames.push(png);
      if (f % 3 === 0 || f === frameCount - 1) {
        report(
          start + renderShare * ((f + 1) / frameCount),
          `Rendu image ${f + 1} / ${frameCount}${clipLabel}`,
        );
      }
    }

    if (plan.codec.id !== 'png') {
      checkAbort();
      report(start + renderShare, `Encodage du fichier${clipLabel}…`);
      const video = await encodeFrames(frames, plan.codec.id, fps, plan.codec.extension, (r) =>
        report(start + renderShare + (share - renderShare) * r, `Encodage du fichier${clipLabel}…`),
      );
      checkAbort();
      outputs[job.fileName] = video;
    }
  }

  if (!plan.zipped) {
    const data = outputs[plan.fileName] as Uint8Array;
    return {
      blob: new Blob([data as BlobPart], { type: mimeFor(plan.codec.extension) }),
      fileName: plan.fileName,
      clipCount: 1,
    };
  }
  report(0.99, 'Création du fichier .zip…');
  // Videos are already compressed: store them as-is (level 0) to keep zipping instant.
  const zipped = zipSync(Object.fromEntries(Object.entries(outputs).map(([k, v]) => [k, [v, { level: 0 }]])));
  return {
    blob: new Blob([zipped as BlobPart], { type: 'application/zip' }),
    fileName: plan.fileName,
    clipCount: jobs.length,
  };
}

function mimeFor(extension: string): string {
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'webm') return 'video/webm';
  if (extension === 'mp4') return 'video/mp4';
  return 'application/octet-stream';
}
