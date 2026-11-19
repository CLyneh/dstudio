import { exitProgress, formatTimecode, itemAt, stepProgress } from './timing';

describe('stepProgress', () => {
  it('is 0 before its start, 1 after its end', () => {
    expect(stepProgress(0.1, 0.2, 0.5)).toBe(0);
    expect(stepProgress(0.45, 0.2, 0.5)).toBeCloseTo(0.5);
    expect(stepProgress(2, 0.2, 0.5)).toBe(1);
  });
});

describe('exitProgress', () => {
  it('stays at 0 until the exit starts', () => expect(exitProgress(1, 4, 0.6, 0.22).out).toBe(0));
  it('reaches 1 at the end of the clip', () => expect(exitProgress(4, 4, 0.6, 0.22).out).toBe(1));
  it('is shorter on short clips', () => expect(exitProgress(0, 1, 0.6, 0.22).start).toBeCloseTo(0.78));
});

describe('itemAt', () => {
  it('finds the item and local time', () => expect(itemAt(7, 3, 3)).toEqual({ index: 2, localTime: 1 }));
  it('clamps to the last item at the very end', () =>
    expect(itemAt(9, 3, 3)).toEqual({ index: 2, localTime: 3 }));
  it('works with an empty list', () => expect(itemAt(1, 3, 0).index).toBe(0));
});

describe('formatTimecode', () => {
  it('formats minutes, seconds and frames', () => expect(formatTimecode(65.5, 30)).toBe('01:05:15'));
  it('never shows a negative time', () => expect(formatTimecode(-2)).toBe('00:00:00'));
});
