# DStudio

Titres, chapitres, synthés et écrans de fin animés pour les montages vidéo de l'équipe.
On choisit un modèle, on tape son texte, on exporte : le fichier sort avec un fond transparent,
prêt à poser au-dessus de la vidéo dans Premiere, DaVinci Resolve, Final Cut ou CapCut.

- **Utiliser l'outil** : ouvrir le site publié (lien GitHub Pages du dépôt), puis lire
  [le guide utilisateur](docs/GUIDE_UTILISATEUR.md).
- **Faire évoluer l'outil** (humain ou agent IA) : lire [AGENTS.md](AGENTS.md).

## Ce que fait la V1

| Modèles                                                                                                                                                                                             | Style                                                                                                                                  | Export                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Titre d'intro (7 animations) · Intertitre de chapitre (7) · Série de chapitres · Synthé (3 cartouches, 4 animations) · Synthés en lot · Carte à jouer (4 finitions, 4 animations 3D) · Écran de fin | Direction artistique Motion Studio v2 · kit de marque partagé · 6 polices · couleurs accent et texte · voile & vignettage · logo animé | MOV ProRes 4444 transparent · WebM transparent · MP4 · PNG · lots en .zip · 25/30/60 i/s |

Formats 16:9, 9:16, 1:1 et 4:5, zones sûres Instagram / TikTok, aperçu sur sa propre vidéo,
enregistrement automatique, annuler / rétablir, fichiers projet à partager.

Tout fonctionne dans le navigateur : aucune vidéo, aucun texte n'est envoyé sur internet.

## Démarrage rapide (développement)

```bash
npm ci                 # installe les dépendances (et copie ffmpeg.wasm dans public/)
npm run dev            # http://localhost:5173
npm run check          # lint + types + tests + build
```

## Documentation

- [Guide utilisateur](docs/GUIDE_UTILISATEUR.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Ajouter un modèle](docs/AJOUTER_UN_MODELE.md)
- [Décisions techniques](docs/DECISIONS.md)
- [Maquette V1](docs/maquette/maquette-v1.html) (`npm run mockup`) · Références : [Motion Studio v2](docs/reference/motion-studio-v2.html), [simulateur v1](docs/reference/gemini-simulator.html)
