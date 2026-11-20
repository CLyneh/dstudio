import { allowListId, readFirebaseConfig } from './config';

const full = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'demo',
  VITE_FIREBASE_APP_ID: '1:2:web:3',
};

describe('readFirebaseConfig', () => {
  it('returns the config when every value is set', () => {
    expect(readFirebaseConfig(full)).toEqual({
      apiKey: 'key',
      authDomain: 'demo.firebaseapp.com',
      projectId: 'demo',
      appId: '1:2:web:3',
    });
  });

  it('turns the gate off when a value is missing or blank', () => {
    expect(readFirebaseConfig({})).toBeNull();
    expect(readFirebaseConfig({ ...full, VITE_FIREBASE_APP_ID: '  ' })).toBeNull();
  });
});

describe('allowListId', () => {
  it('normalizes the e-mail', () => {
    expect(allowListId('  Jane.Doe@Gmail.com ')).toBe('jane.doe@gmail.com');
  });
});
