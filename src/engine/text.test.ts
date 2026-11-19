import { applyCase, parseListLines, slugify, wrapText } from './text';

const measure = (s: string) => s.length * 10;

describe('applyCase', () => {
  it('keeps text as typed', () => expect(applyCase('Un mot', 'normal')).toBe('Un mot'));
  it('uppercases French accents', () => expect(applyCase('été à paris', 'upper')).toBe('ÉTÉ À PARIS'));
  it('capitalises each word, after hyphens and apostrophes', () =>
    expect(applyCase("l'éQUIPE jean-marc", 'title')).toBe("L'Équipe Jean-Marc"));
  it('handles empty input', () => expect(applyCase('', 'upper')).toBe(''));
});

describe('wrapText', () => {
  it('keeps short text on one line', () => expect(wrapText('un deux', 100, measure)).toEqual(['un deux']));
  it('breaks on word boundaries', () =>
    expect(wrapText('aaaa bbbb cccc', 90, measure)).toEqual(['aaaa bbbb', 'cccc']));
  it('never splits a single long word', () =>
    expect(wrapText('supercalifragilistic', 50, measure)).toEqual(['supercalifragilistic']));
  it('merges overflow into the last allowed line', () =>
    expect(wrapText('a b c d', 10, measure, 2)).toEqual(['a', 'b c d']));
  it('ignores extra spaces', () => expect(wrapText('  a   b  ', 100, measure)).toEqual(['a b']));
});

describe('parseListLines', () => {
  it('splits on pipes and skips blank lines', () =>
    expect(parseListLines('Titre A | Sous A\n\n  Titre B|Sous B  \n')).toEqual([
      ['Titre A', 'Sous A'],
      ['Titre B', 'Sous B'],
    ]));
  it('accepts tab-separated columns pasted from a spreadsheet', () =>
    expect(parseListLines('Jean Dupont\tCEO\r\nAnna\tCTO')).toEqual([
      ['Jean Dupont', 'CEO'],
      ['Anna', 'CTO'],
    ]));
  it('allows a missing second column', () => expect(parseListLines('Seul')).toEqual([['Seul', '']]));
});

describe('slugify', () => {
  it('strips accents and punctuation', () =>
    expect(slugify('Gildas Ovono Mba — CEO !')).toBe('gildas-ovono-mba-ceo'));
  it('falls back when empty', () => expect(slugify('!!!')).toBe('sans-titre'));
  it('limits the length without a trailing dash', () => expect(slugify('abc def ghi', 5)).toBe('abc-d'));
});
