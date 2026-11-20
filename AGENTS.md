# AGENTS.md — règles du projet DStudio

Ce fichier est la **source unique** des règles pour tout agent IA ou développeur qui travaille sur ce dépôt
(Claude Code, Gemini / Antigravity, Codex, Cursor…). `CLAUDE.md` et `GEMINI.md` y renvoient.
Si une règle change, on la change **ici**.

## Le projet en une phrase

DStudio est un site web (GitHub Pages, 100 % navigateur, sans serveur) qui fabrique des habillages vidéo animés
(titre d'intro, intertitre de chapitre, synthé nom + fonction, écran de fin…) exportés en vidéo transparente
pour être posés au-dessus d'un montage. Il est fait pour une **équipe interne de débutants** : l'ergonomie prime.

## Commandes

| But                                   | Commande                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------- |
| Installer                             | `npm ci`                                                                  |
| Lancer en local                       | `npm run dev` (http://localhost:5173)                                     |
| Tout vérifier avant commit            | `npm run check` (lint + types + tests unitaires + build)                  |
| Tests unitaires                       | `npm test`                                                                |
| Tests navigateur (e2e)                | `npm run test:e2e` (installer d'abord `npx playwright install chromium`)  |
| Mettre à jour les images de référence | `npm run test:e2e:update` puis **regarder les images** avant de committer |
| Formater                              | `npm run format`                                                          |

Node : version dans `.nvmrc` (24).

## Architecture

```
src/
  engine/       Moteur de rendu PUR (aucun React, aucun DOM sauf canvas) : temps, easing, texte, couleurs,
                polices, logo animé, voile/vignettage, fonds, zones sûres, formats. Testable sans navigateur.
  templates/    Un dossier par modèle (intro, chapter, lower-third, playing-card…). Chaque modèle = un
                TemplateDefinition (champs, animations propres, variantes, phases, items(), render(), fileBase()).
                shared/ = rendus communs portés de Motion Studio v2 (intro, chapitre, synthé, typographie).
                registry.ts liste les modèles (l'ordre = l'ordre sur l'accueil).
  auth/         Accès réservé : connexion Google et liste d'adresses (Firebase, chargé à la demande).
  brand/        Kit de marque (lit presets/brand.json et presets/presets.json, valide tout).
  project/      Le format d'une création (Project), sa validation (parseProject) et son rendu (renderProject).
  export/       Export : choix du format selon le logiciel (targets), noms de fichiers, rendu image par image,
                encodage ffmpeg.wasm (MOV ProRes 4444, WebM VP8, MP4 H.264), zip (fflate).
  state/        Store zustand : créations, kit, préférences, annuler/rétablir, sauvegarde localStorage.
  ui/           React : App (routes par #hash), screens/ (pages), editor/ (étapes + aperçu), components/, styles/.
  test/         Utilitaires de test + hooks e2e (window.__dstudio).
presets/        Kit de marque et préréglages OFFICIELS de l'équipe (JSON, modifiables sans coder).
e2e/            Tests Playwright : parcours, rendu de référence (images), exports réels.
docs/           Guide utilisateur, architecture, décisions, maquette, simulateur Gemini d'origine.
```

Sens des dépendances (à respecter) : `engine` ← `templates` ← `project` ← `export` / `state` ← `ui`.
`engine` et `templates` n'importent **jamais** React, le store ou l'UI.

## Règles de code

0. **Direction artistique** : le rendu suit Motion Studio v2 (`docs/reference/motion-studio-v2.html`). Ne pas changer
   typographie, tailles, couleurs ou animations des modèles sans demande explicite (voir `CLAUDE.md`).
1. **TypeScript strict**, pas de `any`. Code, noms et commentaires en **anglais** ; **tout texte visible
   par l'utilisateur en français**, tutoiement, phrases courtes, sans jargon (« Exporter », pas « Render »).
2. **Rendu déterministe** : `render()` d'un modèle ne dépend que de ses entrées (pas de `Math.random`, pas de
   `Date.now`). Même entrée → mêmes pixels. C'est ce qui permet les tests de non-régression visuelle.
3. Tailles en **pixels de référence × `rc.scale`** (référence = image dont le petit côté fait 1080 px, comme
   Motion Studio). Jamais de px bruts : c'est ce qui rend les 4 formats (16:9, 9:16, 1:1, 4:5) automatiques.
   Les ombres canvas (`shadowBlur`, `shadowOffset*`) ignorent les transformations : les multiplier par `rc.scale`.
4. Les zones masquées par Instagram / TikTok (`VERTICAL_UNSAFE`) sont affichées dans l'aperçu ; le placement
   des modèles suit la DA de référence (ne pas le déplacer sans accord).
5. Toute donnée venant de l'extérieur (fichier importé, localStorage, JSON de `presets/`) passe par une fonction
   `parse…` qui valide et répare. Une vieille sauvegarde ne doit jamais faire planter l'appli.
6. Petits fichiers, une responsabilité par fichier. Pas de fichier « fourre-tout ».
7. Pas de nouvelle dépendance sans raison claire (la noter dans `docs/DECISIONS.md`).
8. Pas de requête réseau vers un service tiers à l'exécution : polices et ffmpeg sont servis par le site.
   Seule exception : Firebase, pour l'accès réservé (`src/auth/`, voir `docs/ACCES_RESERVE.md`).

## Ajouter un modèle

Voir `docs/AJOUTER_UN_MODELE.md`. En résumé : créer `src/templates/<id>/index.ts`, l'ajouter dans
`registry.ts` et dans `TemplateId` (`types.ts`), lancer `npm test` (les tests génériques couvrent
automatiquement le nouveau modèle et chacune de ses animations), ajouter ses images de référence e2e.

## Tests et non-régression

- Toute logique nouvelle (moteur, export, store, validation) a un test unitaire à côté (`*.test.ts`).
- Les tests `src/templates/templates.test.ts` s'appliquent à **tous** les modèles : textes dans le cadre,
  rien d'affiché à t=0, tous les looks × animations sans erreur.
- `e2e/render.spec.ts` compare chaque modèle à des images de référence. Si une différence est **voulue**,
  régénérer avec `npm run test:e2e:update` et vérifier visuellement les nouvelles images.
- `e2e/export.spec.ts` produit de vrais fichiers MOV / WebM / MP4 / ZIP.
- Ne jamais désactiver ou affaiblir un test pour faire passer la CI.

## Git

- `main` est protégée : on travaille sur une branche (`feat/…`, `fix/…`, `docs/…`) et on ouvre une pull request.
- La CI (GitHub Actions) doit être verte avant fusion. La fusion sur `main` publie le site sur GitHub Pages.
- Messages de commit courts, à l'impératif, en anglais (`Add end card template`), un sujet par commit.
- Ne jamais committer : `node_modules/`, `dist/`, `public/ffmpeg/` (copié automatiquement), secrets, `.env`.

## Avant de dire « c'est fini »

1. `npm run check` passe.
2. Si l'UI ou le rendu a changé : `npm run test:e2e` passe, et tu as regardé le résultat dans un navigateur.
3. Le guide utilisateur (`docs/GUIDE_UTILISATEUR.md`) est à jour si le comportement visible a changé.
4. Toute décision structurante est notée dans `docs/DECISIONS.md`.
