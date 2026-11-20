import { useEffect, useState, type ReactNode } from 'react';
import type { AccessClient, AccessState } from '@/auth/access';
import type { FirebaseWebConfig } from '@/auth/config';

interface Props {
  /** null = gate off (local dev, tests): the app shows directly. */
  config: FirebaseWebConfig | null;
  /** Injected in tests; defaults to the real Firebase client. */
  loadClient?: (config: FirebaseWebConfig) => Promise<AccessClient>;
  children: ReactNode;
}

async function defaultLoad(config: FirebaseWebConfig): Promise<AccessClient> {
  const { createAccessClient } = await import('@/auth/access');
  return createAccessClient(config);
}

/** Shows the app only to people whose Google e-mail is on the team list. */
export function AccessGate({ config, loadClient = defaultLoad, children }: Props) {
  const [client, setClient] = useState<AccessClient | null>(null);
  const [state, setState] = useState<AccessState>({ kind: 'checking' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    loadClient(config)
      .then((c) => {
        if (cancelled) return;
        setClient(c);
        stop = c.watch(setState);
      })
      .catch(() =>
        setState({ kind: 'signed-out', error: 'Connexion impossible. Vérifie ta connexion internet.' }),
      );
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [config, loadClient]);

  if (!config || state.kind === 'allowed') return <>{children}</>;

  const signIn = async () => {
    if (!client) return;
    setBusy(true);
    try {
      await client.signIn();
    } catch {
      setState({ kind: 'signed-out', error: "La connexion n'a pas abouti. Réessaie." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      <div className="gate-card" role="main">
        <span className="brand-mark gate-mark" aria-hidden="true">
          D
        </span>
        <h1 className="gate-title">DStudio</h1>
        {state.kind === 'checking' && <p className="gate-text">Vérification de ton accès…</p>}
        {state.kind === 'signed-out' && (
          <>
            <p className="gate-text">Outil réservé à l'équipe. Connecte-toi avec ton compte Google.</p>
            {state.error && (
              <p className="gate-error" role="alert">
                {state.error}
              </p>
            )}
            <button className="btn primary big" type="button" onClick={signIn} disabled={!client || busy}>
              Se connecter avec Google
            </button>
          </>
        )}
        {state.kind === 'denied' && (
          <>
            <p className="gate-text">
              L'adresse <strong>{state.email || 'de ce compte'}</strong> n'a pas accès à DStudio.
            </p>
            <p className="gate-text">Demande au responsable de l'outil de t'ajouter, ou change de compte.</p>
            <button className="btn big" type="button" onClick={() => void client?.signOut()}>
              Changer de compte
            </button>
          </>
        )}
      </div>
    </div>
  );
}
