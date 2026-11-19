import type { FormatId } from '@/engine/formats';
import { slugify } from '@/engine/text';
import type { ItemContent } from '@/engine/types';
import type { TemplateDefinition } from '@/templates/types';

export function formatSuffix(format: FormatId): string {
  return format.replace(':', 'x');
}

/** "synthe_gildas-ovono-mba_16x9.mov" */
export function clipFileName(
  template: TemplateDefinition,
  item: ItemContent,
  index: number,
  format: FormatId,
  extension: string,
): string {
  return `${template.fileBase(item, index)}_${formatSuffix(format)}.${extension}`;
}

/** Name of the file for a whole list template exported as one clip. */
export function sequenceFileName(template: TemplateDefinition, format: FormatId, extension: string): string {
  return `${slugify(template.name)}_${formatSuffix(format)}.${extension}`;
}

export function archiveFileName(template: TemplateDefinition, format: FormatId): string {
  return `${slugify(template.name)}_${formatSuffix(format)}.zip`;
}

/** Frame files inside a PNG export: "intro_titre_16x9/intro_titre_16x9_00001.png". */
export function frameFileName(clipBase: string, frame: number): string {
  return `${clipBase}/${clipBase}_${String(frame + 1).padStart(5, '0')}.png`;
}
