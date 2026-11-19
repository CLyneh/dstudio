export type EditingApp = 'premiere' | 'davinci' | 'fcp' | 'capcut' | 'web' | 'png';
export type ExportBackground = 'alpha' | 'black' | 'green';
export type Codec = 'prores' | 'webm' | 'mp4' | 'png';
export type SeriesMode = 'split' | 'single';

export interface CodecDefinition {
  id: Codec;
  label: string;
  extension: string;
  supportsAlpha: boolean;
}

export const CODECS: Record<Codec, CodecDefinition> = {
  prores: { id: 'prores', label: 'MOV transparent (ProRes 4444)', extension: 'mov', supportsAlpha: true },
  webm: { id: 'webm', label: 'WebM transparent (VP8)', extension: 'webm', supportsAlpha: true },
  mp4: { id: 'mp4', label: 'MP4 (H.264)', extension: 'mp4', supportsAlpha: false },
  png: { id: 'png', label: 'Images PNG (.zip)', extension: 'png', supportsAlpha: true },
};

export interface EditingAppDefinition {
  id: EditingApp;
  label: string;
  /** Codec used when the background is transparent. */
  alphaCodec: Codec;
  note: string;
}

export const EDITING_APPS: readonly EditingAppDefinition[] = [
  {
    id: 'premiere',
    label: 'Premiere Pro',
    alphaCodec: 'prores',
    note: 'Fichier .mov ProRes 4444 : Premiere le lit nativement avec la transparence.',
  },
  {
    id: 'davinci',
    label: 'DaVinci Resolve',
    alphaCodec: 'prores',
    note: 'Fichier .mov ProRes 4444 : DaVinci le lit nativement avec la transparence.',
  },
  {
    id: 'fcp',
    label: 'Final Cut Pro',
    alphaCodec: 'prores',
    note: "Fichier .mov ProRes 4444 : le format natif d'Apple.",
  },
  {
    id: 'capcut',
    label: 'CapCut',
    alphaCodec: 'prores',
    note: "Fichier .mov ProRes 4444 pour CapCut sur ordinateur. Sur téléphone, choisis plutôt le fond vert et l'outil « Incrustation ».",
  },
  {
    id: 'web',
    label: 'Web / autre',
    alphaCodec: 'webm',
    note: 'Fichier .webm léger, transparent dans les navigateurs et la plupart des outils récents.',
  },
  {
    id: 'png',
    label: 'Images PNG',
    alphaCodec: 'png',
    note: 'Une image par frame, transparente. Fonctionne partout, mais plus lourd.',
  },
];

export const FPS_OPTIONS = [25, 30, 60] as const;
export type Fps = (typeof FPS_OPTIONS)[number];

export function getEditingApp(id: EditingApp): EditingAppDefinition {
  return EDITING_APPS.find((a) => a.id === id) ?? (EDITING_APPS[0] as EditingAppDefinition);
}

/** The codec to use for an app and a background. Opaque backgrounds go to MP4 (smaller, readable everywhere). */
export function resolveCodec(app: EditingApp, background: ExportBackground): CodecDefinition {
  const def = getEditingApp(app);
  if (def.alphaCodec === 'png') return CODECS.png;
  if (background === 'alpha') return CODECS[def.alphaCodec];
  return CODECS.mp4;
}

export function backgroundNote(background: ExportBackground): string {
  if (background === 'green')
    return "Fond vert : retire-le avec l'effet « Incrustation » ou « Chroma key » de ton logiciel.";
  if (background === 'black')
    return 'Fond noir : pose le fichier en mode de fusion « Écran » ou en plein cadre.';
  return '';
}
