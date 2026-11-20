import { TEAM_BRAND } from '@/brand/brand';
import { createProject } from '@/project/project';
import { renderProjectFrame } from '@/project/renderProject';
import { createRecordingContext } from '@/test/recordingContext';
import { CARD_TEXT_ANIMATIONS } from './cardRenderer';

describe('card "Zoom & intertitre" text animations', () => {
  it.each(CARD_TEXT_ANIMATIONS.map((a) => a.id))(
    'shows the title at the end of the entrance (%s)',
    (textAnim) => {
      const base = createProject('playing-card', TEAM_BRAND, null, 0);
      const project = {
        ...base,
        animation: { style: 'zoom-intertitle' },
        content: { ...base.content, textAnim, title: 'ENTREPRENEUR' },
      };
      const { ctx, texts } = createRecordingContext();
      renderProjectFrame(ctx, 1080, 1920, project, 4.6, { background: 'transparent', logo: { image: null } });
      expect(texts.map((t) => t.text).join(' ')).toContain('ENTREPRENEUR');
    },
  );

  it('starts with the existing slide & mask', () => {
    expect(CARD_TEXT_ANIMATIONS[0]!.id).toBe('slide-mask');
    expect(new Set(CARD_TEXT_ANIMATIONS.map((a) => a.id)).size).toBe(CARD_TEXT_ANIMATIONS.length);
  });
});
