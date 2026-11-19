import { chapterSeries } from './chapter-series';
import { chapter } from './chapter';
import { endCard } from './end-card';
import { intro } from './intro';
import { lowerThirdBatch } from './lower-third-batch';
import { lowerThird } from './lower-third';
import { playingCard } from './playing-card';
import type { TemplateDefinition, TemplateId } from './types';

/** Order = order on the home screen. To add a template: create a folder, then register it here. */
export const TEMPLATES: readonly TemplateDefinition[] = [
  intro,
  chapter,
  lowerThird,
  playingCard,
  chapterSeries,
  lowerThirdBatch,
  endCard,
];

export function getTemplate(id: TemplateId): TemplateDefinition {
  const found = TEMPLATES.find((t) => t.id === id);
  if (!found) throw new Error(`Unknown template: ${id}`);
  return found;
}

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === 'string' && TEMPLATES.some((t) => t.id === value);
}

/** Default text content of a template. */
export function defaultContent(template: TemplateDefinition): Record<string, string> {
  const content: Record<string, string> = {};
  for (const field of template.fields) content[field.key] = field.defaultValue;
  if (template.list) content.list = template.list.defaultValue;
  return content;
}

export type { TemplateDefinition, TemplateId } from './types';
