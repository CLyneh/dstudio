import type { TemplateField } from '../types';
import { isFieldOn, withoutHiddenFields } from './optionalFields';

const body: TemplateField = {
  key: 'body',
  label: 'Question',
  defaultValue: '',
  optional: 'Ajouter une question',
};
const title: TemplateField = { key: 'title', label: 'Titre', defaultValue: '' };

describe('optional fields', () => {
  it('is on unless switched off', () => {
    expect(isFieldOn(body, { body: 'Q' })).toBe(true);
    expect(isFieldOn(body, { body: 'Q', bodyOff: '1' })).toBe(false);
    expect(isFieldOn(title, { titleOff: '1' })).toBe(true);
  });

  it('blanks only switched-off fields and keeps the text for later', () => {
    const content = { title: 'T', body: 'Q', bodyOff: '1' };
    expect(withoutHiddenFields([title, body], content)).toEqual({ title: 'T', body: '', bodyOff: '1' });
    expect(content.body).toBe('Q');
  });
});
