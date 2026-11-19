import { TEAM_BRAND } from '@/brand/brand';
import { FORMATS } from '@/engine/formats';
import { createProject, projectTotalDuration } from '@/project/project';
import { renderProjectFrame } from '@/project/renderProject';
import { createRecordingContext } from '@/test/recordingContext';
import { TEMPLATES, defaultContent, getTemplate } from './registry';

const logo = { image: null };
const options = { background: 'transparent' as const, logo };

/** Main text of the first item, whatever the template. */
function mainText(item: Record<string, string>): string {
  return (item.line1 || item.title || item.name || item.message || '').trim();
}

describe('template registry', () => {
  it('has unique ids', () => {
    const ids = TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('throws on unknown ids', () => expect(() => getTemplate('nope' as never)).toThrow());
});

describe.each(TEMPLATES.map((t) => [t.id, t] as const))('template %s', (_id, template) => {
  const content = defaultContent(template);

  it('produces at least one item from its default content', () => {
    expect(template.items(content).length).toBeGreaterThan(0);
  });

  it('builds safe, unique file names', () => {
    const names = template.items(content).map((item, i) => template.fileBase(item, i));
    for (const n of names) expect(n).toMatch(/^[a-z0-9_-]+$/);
    expect(new Set(names).size).toBe(names.length);
  });

  it('has animations with unique ids, and valid phases', () => {
    expect(template.animations.length).toBeGreaterThan(0);
    expect(new Set(template.animations.map((a) => a.id)).size).toBe(template.animations.length);
    const p = template.phases(template.defaultDuration);
    expect(p.inEnd).toBeGreaterThan(0);
    expect(p.outStart).toBeGreaterThan(p.inEnd);
    expect(p.outStart).toBeLessThan(template.defaultDuration);
  });

  it.each(template.animations.map((a) => a.id))('shows its main text once entered (%s)', (style) => {
    const base = createProject(template.id, TEAM_BRAND, null, 0);
    const project = { ...base, animation: { style } };
    const { ctx, texts } = createRecordingContext();
    renderProjectFrame(ctx, 1920, 1080, project, project.duration / 2, options);
    const first = template.items(project.content)[0]!;
    const word = mainText(first).split(/\s+/)[0]!;
    expect(texts.map((t) => t.text).join(' ')).toContain(word.slice(0, Math.min(4, word.length)));
  });

  it.each(FORMATS.map((f) => f.id))('keeps every text inside the %s frame', (format) => {
    if (template.id === 'playing-card') return; // drawn in card coordinates
    const project = { ...createProject(template.id, TEAM_BRAND, null, 0), format };
    const f = FORMATS.find((x) => x.id === format)!;
    const { ctx, texts } = createRecordingContext(f.height > f.width ? 14 : 18);
    renderProjectFrame(ctx, f.width, f.height, project, project.duration / 2, options);
    for (const t of texts) {
      expect(t.y).toBeGreaterThan(0);
      expect(t.y).toBeLessThan(f.height);
    }
  });

  it('renders every variant, animation and instant without crashing', () => {
    const base = createProject(template.id, TEAM_BRAND, null, 0);
    const variants = template.variants?.options.map((v) => v.id) ?? [''];
    for (const variant of variants) {
      for (const anim of template.animations) {
        const project = {
          ...base,
          style: { ...base.style, variant, veil: 0.4, vignette: true },
          animation: { style: anim.id },
        };
        const { ctx } = createRecordingContext();
        for (const t of [0, 0.3, 1, projectTotalDuration(project) - 0.1, projectTotalDuration(project)]) {
          expect(() =>
            renderProjectFrame(ctx, 1280, 720, project, t, { background: 'scene', logo }),
          ).not.toThrow();
        }
      }
    }
  });
});

describe('list templates', () => {
  it('reads "surtitre | titre | sous-titre" chapter lines', () => {
    const t = getTemplate('chapter-series');
    expect(t.items({ list: 'CHAPITRE 01 | Manche 1\nSeul titre\nA | B | C' })).toEqual([
      { kicker: 'CHAPITRE 01', title: 'Manche 1', subtitle: '' },
      { kicker: '', title: 'Seul titre', subtitle: '' },
      { kicker: 'A', title: 'B', subtitle: 'C' },
    ]);
  });
  it('returns one lower third per person', () => {
    const t = getTemplate('lower-third-batch');
    expect(t.items({ list: 'Ana | CEO\nBob | CTO\n\n' })).toEqual([
      { name: 'Ana', role: 'CEO' },
      { name: 'Bob', role: 'CTO' },
    ]);
  });
  it('offers ready-made playing cards', () => {
    const t = getTemplate('playing-card');
    expect(t.quickFills?.length).toBe(4);
    for (const q of t.quickFills ?? [])
      expect(Object.keys(q.content).sort()).toEqual(t.fields.map((f) => f.key).sort());
  });
});
