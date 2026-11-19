# Guide utilisateur DStudio

## En 3 étapes

1. **Choisis un modèle** sur l'accueil (onglet « Créer »). Chaque carte montre le résultat animé.
2. **Personnalise** dans l'éditeur, étape par étape :
   - **Texte** : tape tes textes, l'aperçu se met à jour en direct.
   - **Style** : style du cartouche ou finition de carte, couleurs (accent et texte), police, casse, taille,
     voile noir, vignettage, logo (position et animation).
   - **Animation** : chaque modèle a ses propres animations (7 pour les titres et chapitres, 4 pour les synthés
     et les cartes). Survole-en une pour la voir ; règle le temps à l'écran.
3. **Exporte** (étape 4) : indique ton logiciel de montage, DStudio choisit le bon format. Le fichier
   arrive dans ton dossier Téléchargements. Glisse-le sur une piste **au-dessus** de ta vidéo.

## Quel format pour quel logiciel ?

| Logiciel                                     | Format choisi                 | Remarque                                                          |
| -------------------------------------------- | ----------------------------- | ----------------------------------------------------------------- |
| Premiere Pro, DaVinci Resolve, Final Cut Pro | MOV ProRes 4444 (transparent) | Lu nativement.                                                    |
| CapCut ordinateur                            | MOV ProRes 4444 (transparent) | Sur téléphone : exporte en fond vert et utilise « Incrustation ». |
| Web / autre                                  | WebM (transparent)            | Léger ; lu par les navigateurs et la plupart des outils récents.  |
| Images PNG                                   | Suite d'images dans un .zip   | Marche partout, plus lourd.                                       |

Fond **noir** ou **vert** → le fichier est un MP4 classique (pas de transparence) :

- fond vert : retire-le avec l'effet « Incrustation » / « Chroma key » ;
- fond noir : pose le fichier en mode de fusion « Écran ».

**Images par seconde** : prends la même valeur que ta vidéo (30 si tu ne sais pas).

## Astuces

- **Vérifier la lisibilité** : dans l'aperçu, clique « Ma vidéo » ou glisse directement une capture
  ou ta vidéo sur l'aperçu. Elle s'affiche derrière (elle n'est pas exportée).
- **Formats verticaux (9:16)** : les zones sûres s'activent toutes seules. Les zones rouges sont cachées
  par l'interface Instagram / TikTok.
- **Plusieurs synthés d'un coup** : modèle « Synthés en lot », une personne par ligne au format
  `Nom | Fonction`. Tu peux coller deux colonnes depuis Excel ou Google Sheets.
- **Carte à jouer** : choisis un des 4 modèles prêts à l'emploi (défi, rôle secret, carte action, vrai ou faux)
  puis adapte le texte. Avec un logo placé « Dans la carte », il s'affiche dans le cadre d'illustration.
- **Série de chapitres** : une ligne par chapitre (`Surtitre | Titre | Sous-titre`). À l'export, choisis un fichier par
  chapitre ou un seul fichier enchaîné.
- **Préréglages d'équipe** : sur l'accueil, choisis un préréglage (ex. « Reels · dynamique ») avant de
  cliquer sur un modèle : format, look et animation sont déjà réglés.

## Raccourcis clavier (éditeur)

| Touche                       | Action                      |
| ---------------------------- | --------------------------- |
| Espace                       | Lecture / pause             |
| ← →                          | Image précédente / suivante |
| Ctrl + Z                     | Annuler                     |
| Ctrl + Maj + Z (ou Ctrl + Y) | Rétablir                    |
| Ctrl + E                     | Exporter                    |

## Mes créations

Tout est **enregistré automatiquement dans ton navigateur**. Dans « Mes créations » tu peux rouvrir,
dupliquer (pratique pour l'épisode suivant), supprimer, ou télécharger un **fichier projet**
(`.dstudio.json`) pour l'envoyer à un collègue, qui l'importe de son côté.

Attention : vider les données du navigateur efface les créations. Garde un fichier projet des créations
importantes.

## Kit de marque

Onglet « Kit de marque » : nom, logo (PNG ou SVG transparent, 2 Mo max), couleurs, police des titres,
look par défaut. Les nouvelles créations partent de ce kit. « Exporter le kit » / « Importer un kit »
permettent de le partager. Le kit **officiel** de l'équipe est dans le dépôt (`presets/brand.json`) :
une modification validée arrive chez tout le monde.

## En cas de souci

- **Mon logiciel affiche un fond noir** : il ne lit pas ce format transparent. Choisis ton logiciel dans la
  liste à l'export, ou exporte en fond vert.
- **L'export est long** : tout est calculé sur ton ordinateur. Baisse à 25 ou 30 images par seconde.
- **L'export échoue** : réessaie ; sinon choisis « Images PNG » et préviens l'équipe.
