import { TEXT_CASES, type BrandKit, type TeamPreset } from '@/brand/brand';
import { normalizeHex } from '@/engine/color';
import { FONTS } from '@/engine/fonts';
import { FORMATS, type FormatId } from '@/engine/formats';
import { LOGO_MOTIONS, LOGO_PLACEMENTS } from '@/engine/logo';
import { clamp } from '@/engine/math';
import type { AnimationSettings, LogoSettings, StyleSettings, TextCase } from '@/engine/types';
import {
  defaultContent,
  getTemplate,
  isTemplateId,
  type TemplateDefinition,
  type TemplateId,
} from '@/templates/registry';

export const PROJECT_SCHEMA_VERSION = 2;
export const PROJECT_FILE_EXTENSION = '.dstudio.json';

/** One creation ("Mes créations"). Plain JSON: saved in localStorage and in project files. */
export interface Project {
  schemaVersion: number;
  id: string;
  templateId: TemplateId;
  format: FormatId;
  content: Record<string, string>;
  style: StyleSettings;
  animation: AnimationSettings;
  /** Seconds (per item for list templates). */
  duration: number;
  createdAt: number;
  updatedAt: number;
}

export const DURATION_RANGE = { min: 1.5, max: 10, step: 0.5 } as const;
export const TEXT_SCALE_RANGE = { min: 0.6, max: 1.5 } as const;
export const VEIL_MAX = 0.85;

export const DEFAULT_LOGO: LogoSettings = {
  show: true,
  placement: 'above-text',
  motion: 'scale-in',
  size: 1,
  opacity: 1,
};

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultVariant(template: TemplateDefinition): string {
  return template.variants?.options[0]?.id ?? '';
}

export function createProject(
  templateId: TemplateId,
  brand: BrandKit,
  preset?: TeamPreset | null,
  now = Date.now(),
): Project {
  const template = getTemplate(templateId);
  return {
    schemaVersion: PROJECT_SCHEMA_VERSION,
    id: newId(),
    templateId,
    format: preset?.format ?? '16:9',
    content: defaultContent(template),
    style: {
      variant: defaultVariant(template),
      accent: brand.accent,
      textColor: brand.textColor,
      fontId: brand.titleFontId,
      textCase: preset?.textCase ?? 'normal',
      textScale: 1,
      position: 'right',
      veil: preset?.veil ?? 0,
      vignette: preset?.vignette ?? false,
      logo: { ...DEFAULT_LOGO },
    },
    animation: { style: template.animations[0]?.id ?? '' },
    duration: template.defaultDuration,
    createdAt: now,
    updatedAt: now,
  };
}

/** Human title shown in "Mes créations". */
export function projectTitle(project: Project): string {
  const template = getTemplate(project.templateId);
  const items = template.items(project.content);
  if (template.list) {
    const n = items.length;
    return `${template.name} · ${n} ${template.list.itemNoun[n > 1 ? 1 : 0]}`;
  }
  const first = items[0] ?? {};
  const main =
    [first.line1, first.line2].filter(Boolean).join(' ') || first.title || first.name || first.message || '';
  return main.trim() ? `${template.name} · ${main.trim()}` : template.name;
}

/** Full length of a project in seconds (all items back to back). */
export function projectTotalDuration(project: Project): number {
  const template = getTemplate(project.templateId);
  const count = template.list ? Math.max(1, template.items(project.content).length) : 1;
  return count * project.duration;
}

export function duplicateProject(project: Project, now = Date.now()): Project {
  return { ...structuredClone(project), id: newId(), createdAt: now, updatedAt: now };
}

export class ProjectFileError extends Error {}

const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/**
 * Validates unknown JSON (an imported file, old localStorage data) into a Project.
 * Unknown or broken fields fall back to defaults so an old file still opens.
 */
export function parseProject(input: unknown, brand: BrandKit): Project {
  const o = (input && typeof input === 'object' ? input : null) as Record<string, unknown> | null;
  if (!o || !isTemplateId(o.templateId)) {
    throw new ProjectFileError("Ce fichier n'est pas une création DStudio.");
  }
  const template = getTemplate(o.templateId);
  const base = createProject(o.templateId, brand);
  const content: Record<string, string> = { ...base.content };
  if (o.content && typeof o.content === 'object') {
    for (const [k, v] of Object.entries(o.content as Record<string, unknown>)) {
      if (typeof v === 'string') content[k] = v;
    }
  }
  const s = (o.style && typeof o.style === 'object' ? o.style : {}) as Partial<StyleSettings>;
  const l = (s.logo && typeof s.logo === 'object' ? s.logo : {}) as Partial<LogoSettings>;
  const a = (o.animation && typeof o.animation === 'object' ? o.animation : {}) as Partial<AnimationSettings>;
  return {
    ...base,
    id: typeof o.id === 'string' && o.id ? o.id : base.id,
    format: FORMATS.some((f) => f.id === o.format) ? (o.format as FormatId) : base.format,
    content,
    style: {
      variant: template.variants?.options.some((v) => v.id === s.variant) ? s.variant! : base.style.variant,
      accent: (typeof s.accent === 'string' && normalizeHex(s.accent)) || base.style.accent,
      textColor: (typeof s.textColor === 'string' && normalizeHex(s.textColor)) || base.style.textColor,
      fontId: FONTS.some((f) => f.id === s.fontId) ? s.fontId! : base.style.fontId,
      textCase: TEXT_CASES.includes(s.textCase as TextCase) ? (s.textCase as TextCase) : 'normal',
      textScale: clamp(num(s.textScale, 1), TEXT_SCALE_RANGE.min, TEXT_SCALE_RANGE.max),
      position: s.position === 'left' || s.position === 'center' ? s.position : 'right',
      veil: clamp(num(s.veil, 0), 0, VEIL_MAX),
      vignette: s.vignette === true,
      logo: {
        show: typeof l.show === 'boolean' ? l.show : DEFAULT_LOGO.show,
        placement: LOGO_PLACEMENTS.some((p) => p.id === l.placement) ? l.placement! : DEFAULT_LOGO.placement,
        motion: LOGO_MOTIONS.some((m) => m.id === l.motion) ? l.motion! : DEFAULT_LOGO.motion,
        size: clamp(num(l.size, 1), 0.4, 2),
        opacity: clamp(num(l.opacity, 1), 0.1, 1),
      },
    },
    animation: {
      style: template.animations.some((x) => x.id === a.style) ? a.style! : base.animation.style,
    },
    duration: clamp(num(o.duration, base.duration), DURATION_RANGE.min, DURATION_RANGE.max),
    createdAt: num(o.createdAt, base.createdAt),
    updatedAt: num(o.updatedAt, base.updatedAt),
  };
}

export function serializeProject(project: Project): string {
  return JSON.stringify({ ...project, schemaVersion: PROJECT_SCHEMA_VERSION }, null, 2);
}
