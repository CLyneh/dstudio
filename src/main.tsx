import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Fonts are bundled with the site: identical rendering on every computer, offline included.
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import '@fontsource/bricolage-grotesque/800.css';
import '@fontsource/jetbrains-mono/500.css';
// Title fonts: same families and weights as the original Motion Studio.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/inter/900.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@fontsource/montserrat/800.css';
import '@fontsource/montserrat/900.css';
import '@fontsource/playfair-display/700.css';
import '@fontsource/playfair-display/900.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/bebas-neue/400.css';

import './ui/styles/tokens.css';
import './ui/styles/base.css';
import './ui/styles/components.css';
import './ui/styles/screens.css';
import './ui/styles/editor.css';

import { ensureFontsLoaded } from './engine/fonts';
import { installTestHooks } from './test/hooks';
import { readFirebaseConfig } from './auth/config';
import { AccessGate } from './ui/AccessGate';
import { App } from './ui/App';

const firebaseConfig = readFirebaseConfig(import.meta.env);

installTestHooks();

// Render after fonts are ready so canvases never flash a fallback font.
void ensureFontsLoaded().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <AccessGate config={firebaseConfig}>
        <App />
      </AccessGate>
    </StrictMode>,
  );
});
