import { TEAM_BRAND, TEAM_PRESETS, parseBrandKit } from '@/brand/brand';
import {
  createProject,
  parseProject,
  ProjectFileError,
  projectTitle,
  projectTotalDuration,
  serializeProject,
} from './project';

describe('createProject', () => {
  it('starts from the brand kit', () => {
    const p = createProject('intro', TEAM_BRAND);
    expect(p.style.accent).toBe(TEAM_BRAND.accent);
    expect(p.style.fontId).toBe(TEAM_BRAND.titleFontId);
    expect(p.content.line1).toBeTruthy();
  });
  it('applies a team preset', () => {
    const preset = TEAM_PRESETS.find((p) => p.id === 'reels')!;
    const p = createProject('lower-third', TEAM_BRAND, preset);
    expect(p.format).toBe('9:16');
    expect(p.style.textCase).toBe('upper');
  });
  it('uses the first animation and variant of the template', () => {
    const p = createProject('playing-card', TEAM_BRAND);
    expect(p.animation.style).toBe('zoom-intertitle');
    expect(p.style.variant).toBe('noir-collector');
  });
});

describe('projectTotalDuration', () => {
  it('multiplies by the number of items for list templates', () => {
    const p = createProject('lower-third-batch', TEAM_BRAND);
    p.content.list = 'A | a\nB | b\nC | c';
    p.duration = 4;
    expect(projectTotalDuration(p)).toBe(12);
  });
  it('is the duration for single templates', () =>
    expect(projectTotalDuration({ ...createProject('intro', TEAM_BRAND), duration: 5 })).toBe(5));
});

describe('project files', () => {
  it('round-trips through serialize / parse', () => {
    const p = createProject('chapter', TEAM_BRAND);
    p.content.title = 'Épisode spécial';
    expect(parseProject(JSON.parse(serializeProject(p)), TEAM_BRAND)).toEqual(p);
  });
  it('rejects files that are not projects', () => {
    expect(() => parseProject({ hello: 1 }, TEAM_BRAND)).toThrow(ProjectFileError);
    expect(() => parseProject(null, TEAM_BRAND)).toThrow(ProjectFileError);
  });
  it('repairs broken fields instead of failing', () => {
    const p = parseProject(
      {
        templateId: 'intro',
        format: '3:2',
        duration: 999,
        style: { variant: 'neon', textScale: 9, veil: 3, logo: { placement: 'moon' } },
        animation: { style: 'spin' },
      },
      TEAM_BRAND,
    );
    expect(p.format).toBe('16:9');
    expect(p.duration).toBe(10);
    expect(p.style.variant).toBe('');
    expect(p.style.textScale).toBe(1.5);
    expect(p.style.veil).toBe(0.85);
    expect(p.style.logo.placement).toBe('above-text');
    expect(p.animation.style).toBe('split-reveal');
  });
  it('opens files saved before the v2 redesign', () => {
    const p = parseProject(
      {
        templateId: 'lower-third',
        style: { look: 'glass', showLogo: true },
        animation: { style: 'slide', speed: 1 },
      },
      TEAM_BRAND,
    );
    expect(p.animation.style).toBe('drawer-slide');
    expect(p.style.variant).toBe('dark-glass');
  });
  it('builds readable titles', () => {
    expect(projectTitle(createProject('lower-third', TEAM_BRAND))).toMatch(/^Synthé · /);
    expect(projectTitle(createProject('lower-third-batch', TEAM_BRAND))).toBe('Synthés en lot · 3 personnes');
  });
});

describe('parseBrandKit', () => {
  it('keeps valid values and replaces invalid ones', () => {
    const kit = parseBrandKit({
      name: '  Acme ',
      accent: 'F00',
      palette: ['#00ff00', 'oops'],
      titleFontId: 'comic',
      logoDataUrl: 'http://x',
    });
    expect(kit.name).toBe('Acme');
    expect(kit.accent).toBe('#ff0000');
    expect(kit.palette).toEqual(['#00ff00']);
    expect(kit.titleFontId).toBe(TEAM_BRAND.titleFontId);
    expect(kit.logoDataUrl).toBeNull();
  });
});
