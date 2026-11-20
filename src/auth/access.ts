import { allowListId, type FirebaseWebConfig } from './config';

export type AccessState =
  | { kind: 'checking' }
  | { kind: 'signed-out'; error?: string }
  | { kind: 'denied'; email: string }
  | { kind: 'allowed'; email: string };

export interface AccessClient {
  /** Calls `onChange` on every change; returns an unsubscribe function. */
  watch(onChange: (state: AccessState) => void): () => void;
  signIn(): Promise<void>;
  signOut(): Promise<void>;
}

/**
 * Google sign-in + closed allow list. An e-mail is allowed when the Firestore document
 * `allowed/<e-mail>` exists; the security rules (firestore.rules) only let a signed-in user
 * with a verified e-mail read their own document.
 * Firebase is loaded on demand so the site stays light when the gate is off.
 */
export async function createAccessClient(config: FirebaseWebConfig): Promise<AccessClient> {
  const [{ initializeApp }, authModule, { doc, getDoc, getFirestore }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore/lite'),
  ]);
  const { GoogleAuthProvider, getAuth, onAuthStateChanged, signInWithPopup, signOut } = authModule;
  const app = initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  async function check(email: string | null, verified: boolean): Promise<AccessState> {
    if (!email || !verified) return { kind: 'denied', email: email ?? '' };
    try {
      const snap = await getDoc(doc(db, 'allowed', allowListId(email)));
      return snap.exists() ? { kind: 'allowed', email } : { kind: 'denied', email };
    } catch {
      return { kind: 'denied', email };
    }
  }

  return {
    watch(onChange) {
      return onAuthStateChanged(auth, (user) => {
        if (!user) return onChange({ kind: 'signed-out' });
        onChange({ kind: 'checking' });
        void check(user.email, user.emailVerified).then(onChange);
      });
    },
    async signIn() {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    },
    async signOut() {
      await signOut(auth);
    },
  };
}
