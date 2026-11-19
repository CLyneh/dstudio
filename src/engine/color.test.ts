import { hexToRgba, isHexColor, normalizeHex, readableOn } from './color';

describe('color helpers', () => {
  it('normalizes short and long hex', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex('EC4899')).toBe('#ec4899');
    expect(normalizeHex('pink')).toBeNull();
  });
  it('validates hex colors', () => {
    expect(isHexColor('#fff')).toBe(true);
    expect(isHexColor('#ffff')).toBe(false);
  });
  it('converts to rgba', () => expect(hexToRgba('#ff0000', 0.5)).toBe('rgba(255, 0, 0, 0.5)'));
  it('picks dark text on light backgrounds and white text on dark ones', () => {
    expect(readableOn('#ffffff')).toBe('#111318');
    expect(readableOn('#f2c14e')).toBe('#111318');
    expect(readableOn('#0b0b10')).toBe('#ffffff');
    expect(readableOn('#ec4899')).toBe('#ffffff');
  });
});
