import { slugify } from '@/engine/text';
import type { TemplateDefinition } from '../types';
import { CARD_ANIMATIONS, CARD_VARIANTS, cardPhases, drawPlayingCard } from './cardRenderer';

export const playingCard: TemplateDefinition = {
  id: 'playing-card',
  name: 'Carte à jouer',
  description: 'Défi, question ou rôle secret façon jeu de société',
  fields: [
    { key: 'badge', label: 'Catégorie', defaultValue: 'MANCHE 01 • DÉFI' },
    { key: 'number', label: 'Numéro (médaillon)', defaultValue: '01', placeholder: 'Ex. 01, ★ 1, +2, ?' },
    { key: 'title', label: 'Titre', defaultValue: 'ENTREPRENEUR.' },
    {
      key: 'body',
      label: 'Question / règle',
      defaultValue: 'Quelle a été ta plus grande prise de risque cette année ?',
      multiline: true,
    },
    { key: 'footer', label: 'Pied de carte', defaultValue: 'SIESTIFY • ÉDITION SPÉCIALE' },
  ],
  quickFills: [
    {
      label: 'Carte défi / question',
      description: 'Entrepreneur • question',
      content: {
        badge: 'MANCHE 01 • DÉFI',
        number: '01',
        title: 'ENTREPRENEUR.',
        body: 'Quelle a été ta plus grande prise de risque cette année ?',
        footer: 'SIESTIFY • ÉDITION SPÉCIALE',
      },
    },
    {
      label: 'Rôle secret',
      description: 'Façon loup-garou',
      content: {
        badge: 'RÔLE SECRET',
        number: '★ 1',
        title: 'LE VISIONNAIRE',
        body: "Chaque nuit, tu peux anticiper un coup d'avance sur tes adversaires.",
        footer: 'ÉDITION LOUP-GAROU • STUDIO',
      },
    },
    {
      label: 'Carte action +2',
      description: 'Bonus de jeu de plateau',
      content: {
        badge: 'CARTE ACTION • +2',
        number: '+2',
        title: 'DOUBLE VISION',
        body: 'Oblige ton adversaire à répondre en moins de 10 secondes chrono !',
        footer: 'BONUS • JEU DE PLATEAU',
      },
    },
    {
      label: 'Vrai ou faux',
      description: 'Quiz mythe ou réalité',
      content: {
        badge: 'QUIZ • MYTHE OU RÉALITÉ',
        number: '?',
        title: 'VRAI OU FAUX',
        body: '90 % des startups pivotent au moins une fois durant leur première année.',
        footer: 'MANCHE RAPIDE • 1 POINT',
      },
    },
  ],
  defaultDuration: 4.5,
  supportsPosition: false,
  animations: CARD_ANIMATIONS,
  variants: { label: 'Finition de la carte', options: CARD_VARIANTS },
  phases: cardPhases,
  items: (content) => [content],
  render: drawPlayingCard,
  fileBase: (item) => `carte_${slugify(item.title ?? '')}`,
};
