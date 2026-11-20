import type { ItemContent } from '@/engine/types';
import type { TemplateField } from '../types';

/** Content key that stores "this optional field is switched off". */
export function offKey(field: TemplateField): string {
  return `${field.key}Off`;
}

export function isFieldOn(field: TemplateField, content: ItemContent): boolean {
  return !field.optional || content[offKey(field)] !== '1';
}

/** Blanks the optional fields the user switched off, so the renderer simply sees no text. */
export function withoutHiddenFields(fields: TemplateField[], content: ItemContent): ItemContent {
  const out = { ...content };
  for (const field of fields) if (!isFieldOn(field, content)) out[field.key] = '';
  return out;
}
