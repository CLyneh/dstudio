import { slugify } from '@/engine/text';
import {
  drawLowerThirdCard,
  LOWER_THIRD_ANIMATIONS,
  LOWER_THIRD_VARIANTS,
  lowerThirdPhases,
} from '../shared/lowerThirdRenderer';
import type { TemplateDefinition } from '../types';

export const lowerThird: TemplateDefinition = {
  id: 'lower-third',
  name: 'Synthé',
  description: "Le nom et la fonction d'une personne à l'écran",
  fields: [
    { key: 'name', label: 'Nom', defaultValue: 'Gildas OVONO MBA' },
    { key: 'role', label: 'Fonction', defaultValue: 'Co-founder & CEO Siestify' },
  ],
  defaultDuration: 4.5,
  supportsPosition: true,
  animations: LOWER_THIRD_ANIMATIONS,
  variants: { label: 'Style du cartouche', options: LOWER_THIRD_VARIANTS },
  phases: lowerThirdPhases,
  items: (content) => [content],
  render: (rc, item) => drawLowerThirdCard(rc, item.name ?? '', item.role ?? ''),
  fileBase: (item) => `synthe_${slugify(item.name ?? '')}`,
};
