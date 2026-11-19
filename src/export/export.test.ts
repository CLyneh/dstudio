import { TEAM_BRAND } from '@/brand/brand';
import { createProject } from '@/project/project';
import { encoderArgs } from './encoderArgs';
import { planExport } from './exportProject';
import { EDITING_APPS, resolveCodec } from './targets';

describe('resolveCodec', () => {
  it('uses ProRes 4444 for desktop editors with transparency', () => {
    for (const app of ['premiere', 'davinci', 'fcp', 'capcut'] as const)
      expect(resolveCodec(app, 'alpha').id).toBe('prores');
  });
  it('uses WebM for web', () => expect(resolveCodec('web', 'alpha').id).toBe('webm'));
  it('switches to MP4 when the background is opaque', () => {
    expect(resolveCodec('premiere', 'green').id).toBe('mp4');
    expect(resolveCodec('web', 'black').id).toBe('mp4');
  });
  it('keeps PNG whatever the background', () => expect(resolveCodec('png', 'black').id).toBe('png'));
  it('every app has an explanation', () => {
    for (const app of EDITING_APPS) expect(app.note.length).toBeGreaterThan(10);
  });
});

describe('encoderArgs', () => {
  it('keeps the alpha channel for ProRes and WebM', () => {
    expect(encoderArgs('prores', 30, 'o.mov')).toContain('yuva444p10le');
    expect(encoderArgs('webm', 30, 'o.webm')).toContain('yuva420p');
  });
  it('passes the frame rate and output name', () => {
    const args = encoderArgs('mp4', 25, 'o.mp4');
    expect(args.slice(0, 2)).toEqual(['-framerate', '25']);
    expect(args.at(-1)).toBe('o.mp4');
  });
});

describe('planExport', () => {
  it('names a single clip after its content and format', () => {
    const p = createProject('lower-third', TEAM_BRAND);
    p.format = '9:16';
    const plan = planExport(p, 'premiere', 'alpha', 'split');
    expect(plan.fileName).toBe('synthe_gildas-ovono-mba_9x16.mov');
    expect(plan.zipped).toBe(false);
  });
  it('zips one file per item for list templates', () => {
    const p = createProject('lower-third-batch', TEAM_BRAND);
    const plan = planExport(p, 'web', 'alpha', 'split');
    expect(plan.zipped).toBe(true);
    expect(plan.fileName).toBe('synthes-en-lot_16x9.zip');
    expect(plan.clipNames).toHaveLength(3);
    expect(plan.clipNames[0]).toBe('synthe-01_gildas-ovono-mba_16x9.webm');
  });
  it('can export a list template as one chained file', () => {
    const p = createProject('chapter-series', TEAM_BRAND);
    const plan = planExport(p, 'premiere', 'alpha', 'single');
    expect(plan.zipped).toBe(false);
    expect(plan.fileName).toBe('serie-de-chapitres_16x9.mov');
  });
  it('always zips PNG sequences', () => {
    const plan = planExport(createProject('intro', TEAM_BRAND), 'png', 'alpha', 'split');
    expect(plan.zipped).toBe(true);
    expect(plan.fileName).toBe('intro_un-mot-deux-reponses_16x9.zip');
  });
});
