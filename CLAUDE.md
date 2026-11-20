# CLAUDE.md

@AGENTS.md

Les règles techniques du projet sont dans `AGENTS.md` (importé ci-dessus). Ce fichier ajoute les
**préférences de la personne qui pilote le projet**. Il est mis à jour au fil du projet, dès qu'une nouvelle
préférence ou manière de travailler apparaît.

## Qui pilote le projet

- Responsable du projet, monteur·se vidéo pour une équipe interne. **Aucune connaissance en code ni en dev.**
- Parle français : toutes les réponses, explications et questions en **français simple**, sans jargon.
  Quand un terme technique est inévitable, l'expliquer en une phrase.
- Quand une action demande de taper une commande, donner la commande exacte, prête à copier, et dire
  ce qu'elle fait. Dans Claude Code, proposer le préfixe `!` pour la lancer dans la session.

## Manière de travailler

- Prendre les meilleures décisions de façon autonome ; **ne poser une question qu'en cas de vrai doute**
  (choix de goût, de produit, ou action irréversible / visible de l'extérieur).
- Pendant une absence : avancer au maximum, et **regrouper les points bloquants** pour le retour.
- **Pas de sous-agents** (coût en tokens) : tout faire dans la conversation principale.
- Toute nouvelle fonctionnalité visible est d'abord **maquettée** (artefact HTML, pas un canevas) et validée
  avant d'être codée.
- Rester dans le périmètre du projet : ne pas lire les fichiers personnels hors de ce dépôt sans raison.
- Présenter le résultat de façon concrète : ce qui marche, ce qui a été vérifié, ce qui reste à faire.

## Direction artistique (règle forte)

- Le rendu des modèles suit **la direction artistique de Motion Studio v2** (`docs/reference/motion-studio-v2.html`) :
  typographie, graisses, tailles, couleurs, ombres, animations et leurs noms. **Ne jamais la remplacer ou la
  « moderniser » sans accord explicite.** Un nouveau modèle reprend ce même langage visuel.
- L'interface de l'outil (menus, panneaux) peut évoluer pour l'ergonomie ; le rendu vidéo, non.
- Quand une nouvelle version de référence est fournie (v3…), la copier dans `docs/reference/` et aligner le rendu dessus.

## Contexte produit

- Outil pour l'**équipe interne**, utilisateurs débutants : chaque écran doit se comprendre sans formation.
- Références : `docs/reference/motion-studio-v2.html` (référence actuelle) et `docs/reference/gemini-simulator.html` (v1).
- La maquette V1 (en attente de validation) : `docs/maquette/maquette-v1.html`, régénérée par `npm run mockup`
  (elle utilise le vrai moteur de rendu). Lien artefact : https://claude.ai/artifact/J4UYij6GaXuCtmSeqjnALe
