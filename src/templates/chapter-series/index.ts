import { slugify } from '@/engine/text';
import { CHAPTER_ANIMATIONS, chapterPhases, drawChapterTitle } from '../shared/chapterRenderer';
import type { TemplateDefinition } from '../types';

/** "Surtitre | Titre | Sous-titre" per line; a single part is the title alone. */
export function parseChapterLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[|\t]\s*/).map((p) => p.trim());
      if (parts.length >= 2)
        return { kicker: parts[0] ?? '', title: parts[1] ?? '', subtitle: parts[2] ?? '' };
      return { kicker: '', title: parts[0] ?? '', subtitle: '' };
    });
}

export const chapterSeries: TemplateDefinition = {
  id: 'chapter-series',
  name: 'Série de chapitres',
  description: "Tous les intertitres d'une vidéo d'un coup",
  fields: [],
  list: {
    label: 'Un chapitre par ligne',
    hint: 'Format : Surtitre | Titre | Sous-titre (le sous-titre est facultatif). Tu peux coller des colonnes depuis Excel.',
    defaultValue: 'CHAPITRE 01 | Manche 1\nCHAPITRE 02 | Vrai ou Faux\nCHAPITRE 03 | Premièrement',
    itemNoun: ['chapitre', 'chapitres'],
  },
  defaultDuration: 2.5,
  supportsPosition: false,
  animations: CHAPTER_ANIMATIONS,
  phases: chapterPhases,
  items: (content) => parseChapterLines(content.list ?? ''),
  render: (rc, item) =>
    drawChapterTitle(rc, {
      kicker: item.kicker ?? '',
      title: item.title ?? '',
      subtitle: item.subtitle ?? '',
    }),
  fileBase: (item, index) => `intertitre-${String(index + 1).padStart(2, '0')}_${slugify(item.title ?? '')}`,
};
