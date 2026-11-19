import type { Project } from '@/project/project';
import { getTemplate } from '@/templates/registry';
import { archiveFileName, clipFileName, sequenceFileName } from './fileNames';
import { resolveCodec, type EditingApp, type ExportBackground, type SeriesMode } from './targets';

/** Describes what an export will produce, without rendering (used by the UI). */
export function planExport(
  project: Project,
  app: EditingApp,
  background: ExportBackground,
  seriesMode: SeriesMode,
) {
  const template = getTemplate(project.templateId);
  const codec = resolveCodec(app, background);
  const items = template.items(project.content);
  const single = !template.list || seriesMode === 'single' || items.length <= 1;
  const clipNames = single
    ? [
        template.list
          ? sequenceFileName(template, project.format, codec.extension)
          : clipFileName(template, items[0] ?? {}, 0, project.format, codec.extension),
      ]
    : items.map((item, i) => clipFileName(template, item, i, project.format, codec.extension));
  const zipped = codec.id === 'png' || clipNames.length > 1;
  const fileName = zipped
    ? clipNames.length > 1
      ? archiveFileName(template, project.format)
      : (clipNames[0] as string).replace(/\.png$/, '.zip')
    : (clipNames[0] as string);
  return { template, codec, items, single, clipNames, zipped, fileName };
}
