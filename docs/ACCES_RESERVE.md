# Accès réservé (connexion Google + liste d'adresses)

Le site est public (GitHub Pages), mais l'outil ne s'affiche qu'aux personnes dont l'adresse Google est
dans la liste. La connexion et la liste sont gérées par **Firebase** (gratuit).

## Limite à connaître

GitHub Pages donne les fichiers du site à tout le monde. L'écran de connexion empêche d'utiliser l'outil
normalement, mais une personne technique pourrait le contourner. Il n'y a aucune donnée d'équipe sur un
serveur (les créations restent dans le navigateur de chacun), donc le risque est faible.

## Mise en place (une seule fois)

1. Sur https://console.firebase.google.com : **Créer un projet** (Google Analytics : inutile).
2. **Authentication** → Commencer → **Google** → Activer → Enregistrer.
3. **Authentication → Paramètres → Domaines autorisés** → ajouter `<ton-compte-github>.github.io`.
4. **Firestore Database** → Créer une base (mode production, région `europe-west`).
5. **Firestore → Règles** : coller le contenu du fichier `firestore.rules` du dépôt → Publier.
6. **Paramètres du projet** (roue dentée) → Vos applications → icône `</>` (Web) → nom « DStudio » →
   recopier les 4 valeurs `apiKey`, `authDomain`, `projectId`, `appId`.
7. Les enregistrer dans GitHub (ces valeurs ne sont pas secrètes) :

   ```
   gh variable set FIREBASE_API_KEY --body "..."
   gh variable set FIREBASE_AUTH_DOMAIN --body "..."
   gh variable set FIREBASE_PROJECT_ID --body "..."
   gh variable set FIREBASE_APP_ID --body "..."
   ```

Sans ces 4 variables, la publication s'arrête avec une erreur : le site n'est jamais publié sans l'accès réservé.

## Ajouter ou retirer une personne

Firestore → collection **`allowed`** → **Ajouter un document** :

- ID du document : l'adresse e-mail **en minuscules** (ex. `prenom.nom@gmail.com`) ;
- un champ quelconque, par exemple `nom` = « Prénom Nom ».

Pour retirer l'accès : supprimer le document. Effet à la prochaine ouverture du site.

## En local

`npm run dev` et les tests n'ont pas les variables Firebase : l'écran de connexion est désactivé.
