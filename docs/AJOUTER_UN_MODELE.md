# Ajouter un modèle

Exemple : un modèle « Citation » (une phrase + son auteur).

1. **Créer** `src/templates/quote/index.ts` :

   ```ts
   import { slugify } from '@/engine/text';
   import { drawTitleCard } from '../shared/titleCard';
   import type { TemplateDefinition } from '../types';

   export const quote: TemplateDefinition = {
     id: 'quote',
     name: 'Citation',
     description: 'Une phrase forte et son auteur',
     isNew: true,
     fields: [
       { key: 'text', label: 'Citation', defaultValue: '« Le sommeil est un super-pouvoir »' },
       { key: 'author', label: 'Auteur', defaultValue: 'Camille Durand' },
     ],
     defaultDuration: 5,
     supportsPosition: false,
     items: (content) => [content],
     render: (rc, item) =>
       drawTitleCard(
         rc,
         { kicker: '', title: item.text ?? '', subtitle: item.author ?? '' },
         { kickerAsPill: false, allowLogo: false },
       ),
     fileBase: (item) => `citation_${slugify(item.author ?? '')}`,
   };
   ```

   Pour un dessin spécifique, écrire sa propre fonction `render` (voir `end-card/index.ts`) en respectant
   les règles : tailles en `rc.unit`, progression avec `elementProgress`, animation avec `withAnimation`,
   aucune source d'aléatoire.

2. **Déclarer** l'id dans `TemplateId` (`src/templates/types.ts`) et l'ajouter à `TEMPLATES`
   (`src/templates/registry.ts`). L'ordre de la liste = l'ordre sur l'accueil.

3. **Tester** : `npm test`. Les tests génériques de `templates.test.ts` vérifient automatiquement le nouveau
   modèle (noms de fichiers, textes dans le cadre, tous les looks et animations).

4. **Images de référence** : ajouter l'id dans `TEMPLATES` de `e2e/render.spec.ts`, lancer
   `npm run test:e2e:update`, regarder les nouvelles images dans `e2e/__screenshots__/`, committer.

5. **Documenter** le modèle dans `docs/GUIDE_UTILISATEUR.md` si son usage n'est pas évident.
