# Décisions techniques

Format : date — décision — pourquoi. Les plus récentes en haut.

## 2026-11-19 — Rendu aligné sur Motion Studio v2

La première version de DStudio avait sa propre direction artistique (panneaux, looks génériques). Demande
explicite : suivre celle de Motion Studio v2. Les rendus intro / chapitre / synthé / carte à jouer sont des
portages fidèles du code v2 (mêmes tailles en px pour 1080 px de petit côté, mêmes graisses, ombres, timings,
noms d'animations). Vérifié image par image contre la v2. Chaque modèle a ses propres animations et variantes ;
les « looks » génériques et la vitesse d'animation ont été retirés. Les créations sauvegardées avant ce changement
s'ouvrent quand même (`parseProject` remplace les anciens réglages par les valeurs par défaut).

## 2026-11-19 — La maquette utilise le vrai moteur

`npm run mockup` empaquette le moteur (`scripts/mockup/engine-entry.ts`) dans une page HTML autonome : la maquette
montre exactement le rendu de l'outil, sans second moteur à maintenir.

## 2026-11-19 — WebM en VP8 et non VP9

VP9 avec transparence fait planter l'onglet (mémoire) dans ffmpeg.wasm en 1080p. VP8 + alpha fonctionne,
est lu par Chrome / Edge / Firefox et la plupart des outils. À revoir si on passe à WebCodecs.

## 2026-11-19 — Export par ffmpeg.wasm servi par le site

Seul moyen de produire dans le navigateur du **MOV ProRes 4444 transparent**, le format que lisent
Premiere, DaVinci, Final Cut et CapCut ordinateur. Le cœur (~32 Mo) est copié dans `public/ffmpeg/` à
l'installation (`scripts/copy-ffmpeg-core.mjs`) et servi par GitHub Pages : pas de CDN à l'exécution.
Version mono-thread (GitHub Pages ne permet pas les en-têtes COOP/COEP nécessaires au multi-thread).
Mesuré : ~10 images/s en ProRes 1080p, ~6 images/s en VP8.

## 2026-11-19 — Rendu image par image au lieu de MediaRecorder

Le simulateur Gemini enregistrait le canvas en temps réel : images sautées sur un ordinateur chargé, et
seulement du WebM. Le rendu déterministe image par image donne un résultat identique partout et permet les
tests de non-régression visuelle.

## 2026-11-19 — Pile : React + TypeScript + Vite, zustand, Vitest, Playwright

Pile la plus répandue, donc la mieux connue des agents IA et des développeurs. zustand : store minimal avec
persistance intégrée. Pas de framework CSS : quelques fichiers CSS avec des variables (tokens).

## 2026-11-19 — Polices embarquées (@fontsource)

Rendu identique sur tous les postes, hors ligne compris, et images de référence stables pour les tests.

## 2026-11-19 — Routage par #hash

`#accueil`, `#editeur`… fonctionne sur GitHub Pages sans configuration serveur.

## 2026-11-19 — Interface sombre uniquement

Comme tous les logiciels de montage : on juge une image vidéo sur un fond sombre.

## 2026-11-19 — Langues

Code et commentaires en anglais ; interface, documentation et règles du projet en français.
