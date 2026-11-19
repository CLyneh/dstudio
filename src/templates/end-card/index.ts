import { slugify } from '@/engine/text';
import { drawIntroTitle, INTRO_ANIMATIONS, introPhases } from '../shared/introRenderer';
import type { TemplateDefinition } from '../types';

/** Same typography as the intro: message, call to action in the accent color, account in the pill. */
export const endCard: TemplateDefinition = {
  id: 'end-card',
  name: 'Écran de fin',
  description: "Remerciement, appel à l'action, réseaux",
  isNew: true,
  fields: [
    {
      key: 'handle',
      label: 'Compte (étiquette)',
      defaultValue: '@siestify',
      placeholder: 'Laisser vide pour masquer',
    },
    { key: 'message', label: 'Message', defaultValue: "Merci d'avoir regardé" },
    { key: 'cta', label: "Appel à l'action (couleur d'accent)", defaultValue: 'Abonne-toi !' },
  ],
  defaultDuration: 5,
  supportsPosition: false,
  animations: [
    ...INTRO_ANIMATIONS.filter((a) => a.id === 'kinetic-impact'),
    ...INTRO_ANIMATIONS.filter((a) => a.id !== 'kinetic-impact'),
  ],
  phases: introPhases,
  items: (content) => [content],
  render: (rc, item) =>
    drawIntroTitle(rc, { badge: item.handle ?? '', line1: item.message ?? '', line2: item.cta ?? '' }),
  fileBase: (item) => `fin_${slugify(item.cta || item.message || 'ecran')}`,
};
