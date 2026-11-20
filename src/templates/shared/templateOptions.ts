import type { ItemContent } from '@/engine/types';
import type { TemplateOption } from '../types';

/** Chosen id of an extra option, or its default when missing or unknown (old saves). */
export function optionValue(option: TemplateOption, content: ItemContent): string {
  const value = content[option.key];
  return option.options.some((o) => o.id === value) ? value! : (option.options[0]?.id ?? '');
}
