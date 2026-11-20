import type { ItemContent, RenderContext } from '@/engine/types';

export type TemplateId =
  'intro' | 'chapter' | 'chapter-series' | 'lower-third' | 'lower-third-batch' | 'playing-card' | 'end-card';

export interface TemplateField {
  key: string;
  label: string;
  defaultValue: string;
  placeholder?: string;
  /** Multi-line text (card body). */
  multiline?: boolean;
  /** Checkbox label: the field can be switched off (stored as `<key>Off` = '1' in the content). */
  optional?: string;
}

/** Multi-item templates take one item per line in `content.list`. */
export interface TemplateListField {
  label: string;
  hint: string;
  defaultValue: string;
  /** Singular / plural name of one item, for counters ("3 chapitres"). */
  itemNoun: [string, string];
}

/** A named choice shown as a button (animation, variant). */
export interface Choice {
  id: string;
  label: string;
  description: string;
}

/** Ready-made text content the user can apply in one click. */
export interface QuickFill {
  label: string;
  description: string;
  content: Record<string, string>;
}

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  description: string;
  /** Not in the original Motion Studio. */
  isNew?: boolean;
  fields: TemplateField[];
  list?: TemplateListField;
  quickFills?: QuickFill[];
  /** Seconds; per item for list templates. */
  defaultDuration: number;
  supportsPosition: boolean;
  /** Animations specific to this template; the first is the default. */
  animations: Choice[];
  /** Visual variants (card style, card finish…); the first is the default. */
  variants?: { label: string; options: Choice[] };
  /** Entrance end and exit start (seconds) for the timeline colors. */
  phases(duration: number): { inEnd: number; outStart: number };
  /** One entry per output clip. Single templates return [content]. */
  items(content: ItemContent): ItemContent[];
  /** Draws one frame of one item. Must be pure: same inputs → same pixels. */
  render(rc: RenderContext, item: ItemContent): void;
  /** File name without extension or format suffix. */
  fileBase(item: ItemContent, index: number): string;
}
