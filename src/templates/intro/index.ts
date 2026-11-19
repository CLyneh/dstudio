import { slugify } from '@/engine/text';
import { drawIntroTitle, INTRO_ANIMATIONS, introPhases } from '../shared/introRenderer';
import type { TemplateDefinition } from '../types';

export const intro: TemplateDefinition = {
  id: 'intro',
  name: "Titre d'intro",
  description: 'Ouvre ta vidéo avec un grand titre animé',
  fields: [
    {
      key: 'badge',
      label: 'Étiquette',
      defaultValue: 'SIESTIFY • ENTRETIEN CROISÉ',
      placeholder: 'Laisser vide pour masquer',
    },
    { key: 'line1', label: 'Ligne 1', defaultValue: 'Un mot,' },
    {
      key: 'line2',
      label: "Ligne 2 (couleur d'accent)",
      defaultValue: 'Deux réponses',
      placeholder: 'Facultatif',
    },
  ],
  defaultDuration: 4,
  supportsPosition: false,
  animations: INTRO_ANIMATIONS,
  phases: introPhases,
  items: (content) => [content],
  render: (rc, item) =>
    drawIntroTitle(rc, { badge: item.badge ?? '', line1: item.line1 ?? '', line2: item.line2 ?? '' }),
  fileBase: (item) => `intro_${slugify(`${item.line1 ?? ''} ${item.line2 ?? ''}`)}`,
};
