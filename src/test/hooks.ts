import { TEAM_BRAND } from '@/brand/brand';
import type { BackgroundMode } from '@/engine/backgrounds';
import { ensureFontsLoaded } from '@/engine/fonts';
import { previewSize, type FormatId } from '@/engine/formats';
import { exportProject } from '@/export/exportProject';
import type { EditingApp, ExportBackground } from '@/export/targets';
import { createProject } from '@/project/project';
import { renderProjectFrame } from '@/project/renderProject';
import type { TemplateId } from '@/templates/registry';

export interface RenderRequest {
  templateId: TemplateId;
  time: number;
  format?: FormatId;
  variant?: string;
  animation?: string;
  /** Default: the demo scene. */
  background?: BackgroundMode;
  /** Long side in px (default 960). */
  size?: number;
}

/**
 * Hooks used by the end-to-end tests (e2e/) to render frames deterministically.
 * They only read inputs and return images: harmless in production.
 */
export function installTestHooks(): void {
  const api = {
    async renderFrame(req: RenderRequest): Promise<string> {
      await ensureFontsLoaded();
      const project = createProject(req.templateId, TEAM_BRAND, null, 0);
      project.format = req.format ?? '16:9';
      if (req.variant) project.style.variant = req.variant;
      if (req.animation) project.animation.style = req.animation;
      const { width, height } = previewSize(project.format, req.size ?? 960);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      renderProjectFrame(ctx, width, height, project, req.time, {
        background: req.background ?? 'scene',
        logo: { image: null },
      });
      return canvas.toDataURL('image/png');
    },
    async exportFile(templateId: TemplateId, app: EditingApp, background: ExportBackground, duration = 2) {
      const project = createProject(templateId, TEAM_BRAND, null, 0);
      project.duration = duration;
      const result = await exportProject({
        project,
        app,
        background,
        fps: 25,
        seriesMode: 'split',
        logo: { image: null },
      });
      const bytes = new Uint8Array(await result.blob.arrayBuffer());
      return {
        fileName: result.fileName,
        size: bytes.length,
        head: Array.from(bytes.slice(0, 16)),
        type: result.blob.type,
      };
    },
  };
  (window as unknown as { __dstudio: typeof api }).__dstudio = api;
}
