import { useState } from 'react';
import { HelpDrawer } from './components/HelpDrawer';
import { ToastProvider } from './components/Toast';
import { useHashRoute, type Route } from './hooks/useHashRoute';
import { BrandScreen } from './screens/BrandScreen';
import { CreationsScreen } from './screens/CreationsScreen';
import { EditorScreen } from './screens/EditorScreen';
import { HomeScreen } from './screens/HomeScreen';

const NAV: [Route, string][] = [
  ['accueil', 'Créer'],
  ['editeur', 'Éditeur'],
  ['marque', 'Kit de marque'],
  ['creations', 'Mes créations'],
];

export function App() {
  const route = useHashRoute();
  const [help, setHelp] = useState(false);

  return (
    <ToastProvider>
      <header className="appbar">
        <a className="brand" href="#accueil" aria-label="DStudio, accueil">
          <span className="brand-mark" aria-hidden="true">
            D
          </span>
          <span>DStudio</span>
        </a>
        <nav className="nav" aria-label="Navigation principale">
          {NAV.map(([r, label]) => (
            <a key={r} href={`#${r}`} aria-current={route === r ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <button className="btn" type="button" onClick={() => setHelp(true)} style={{ borderRadius: 99 }}>
          ? Aide
        </button>
      </header>
      <main>
        {route === 'accueil' && <HomeScreen />}
        {route === 'editeur' && <EditorScreen />}
        {route === 'marque' && <BrandScreen />}
        {route === 'creations' && <CreationsScreen />}
      </main>
      <HelpDrawer open={help} onClose={() => setHelp(false)} />
    </ToastProvider>
  );
}
