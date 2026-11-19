import { slugify } from '@/engine/text';
import { CHAPTER_ANIMATIONS, chapterPhases, drawChapterTitle } from '../shared/chapterRenderer';
import type { TemplateDefinition } from '../types';

export const chapter: TemplateDefinition = {
  id: 'chapter',
  name: 'Intertitre de chapitre',
  description: 'Sépare les grandes parties de ta vidéo',
  fields: [
    {
      key: 'kicker',
      label: 'Surtitre',
      defaultValue: 'CHAPITRE 01',
      placeholder: 'Laisser vide pour masquer',
    },
    { key: 'title', label: 'Titre', defaultValue: 'Manche 1' },
    { key: 'subtitle', label: 'Sous-titre', defaultValue: '', placeholder: 'Facultatif' },
  ],
  defaultDuration: 2.5,
  supportsPosition: false,
  animations: CHAPTER_ANIMATIONS,
  phases: chapterPhases,
  items: (content) => [content],
  render: (rc, item) =>
    drawChapterTitle(rc, {
      kicker: item.kicker ?? '',
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
    }),
  fileBase: (item) => `intertitre_${slugify(item.title ?? '')}`,
};
