import { parseListLines, slugify } from '@/engine/text';
import {
  drawLowerThirdCard,
  LOWER_THIRD_ANIMATIONS,
  LOWER_THIRD_VARIANTS,
  lowerThirdPhases,
} from '../shared/lowerThirdRenderer';
import type { TemplateDefinition } from '../types';

export const lowerThirdBatch: TemplateDefinition = {
  id: 'lower-third-batch',
  name: 'Synthés en lot',
  description: 'Colle une liste, récupère un fichier par personne',
  isNew: true,
  fields: [],
  list: {
    label: 'Une personne par ligne',
    hint: 'Format : Nom | Fonction. Tu peux coller deux colonnes depuis Excel ou Google Sheets.',
    defaultValue:
      'Gildas OVONO MBA | Co-founder & CEO Siestify\nJohn SELAN | Co-founder Siestify & Myup\nCamille Durand | Experte du sommeil',
    itemNoun: ['personne', 'personnes'],
  },
  defaultDuration: 4.5,
  supportsPosition: true,
  animations: LOWER_THIRD_ANIMATIONS,
  variants: { label: 'Style du cartouche', options: LOWER_THIRD_VARIANTS },
  phases: lowerThirdPhases,
  items: (content) => parseListLines(content.list ?? '').map(([name, role]) => ({ name, role })),
  render: (rc, item) => drawLowerThirdCard(rc, item.name ?? '', item.role ?? ''),
  fileBase: (item, index) => `synthe-${String(index + 1).padStart(2, '0')}_${slugify(item.name ?? '')}`,
};
