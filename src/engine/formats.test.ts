import { designScale } from './formats';

describe('designScale', () => {
  it('keeps landscape and square at the reference size', () => {
    expect(designScale(1920, 1080)).toBeCloseTo(1);
    expect(designScale(1080, 1080)).toBeCloseTo(1);
    expect(designScale(960, 540)).toBeCloseTo(0.5);
  });

  it('enlarges tall frames for phone screens', () => {
    expect(designScale(1080, 1920)).toBeCloseTo(1.4);
    expect(designScale(1080, 1350)).toBeCloseTo(1.13, 2);
    expect(designScale(540, 960)).toBeCloseTo(0.7);
  });
});
