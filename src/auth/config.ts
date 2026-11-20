/** Public Firebase web config. These values are not secrets: they identify the project, security comes from the rules. */
export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

type Env = Record<string, string | boolean | undefined>;

/**
 * Reads the Firebase config injected at build time (VITE_FIREBASE_*).
 * Returns null when it is missing: the access gate is then off (local dev, tests).
 */
export function readFirebaseConfig(env: Env): FirebaseWebConfig | null {
  const get = (key: string) => {
    const value = env[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  const config = {
    apiKey: get('VITE_FIREBASE_API_KEY'),
    authDomain: get('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: get('VITE_FIREBASE_PROJECT_ID'),
    appId: get('VITE_FIREBASE_APP_ID'),
  };
  return Object.values(config).every(Boolean) ? config : null;
}

/** Firestore document id used for an e-mail in the allow list. */
export function allowListId(email: string): string {
  return email.trim().toLowerCase();
}
