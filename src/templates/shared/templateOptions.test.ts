import { optionValue } from './templateOptions';

const back = {
  key: 'back',
  label: 'Dos',
  options: [
    { id: 'a', label: 'A', description: '' },
    { id: 'b', label: 'B', description: '' },
  ],
};

describe('optionValue', () => {
  it('returns the chosen option', () => {
    expect(optionValue(back, { back: 'b' })).toBe('b');
  });
  it('falls back to the first option when missing or unknown', () => {
    expect(optionValue(back, {})).toBe('a');
    expect(optionValue(back, { back: 'zzz' })).toBe('a');
  });
});
