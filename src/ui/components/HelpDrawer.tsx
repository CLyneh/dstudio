import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const QUESTIONS: [string, string][] = [
  [
    'Comment mettre le titre sur ma vidéo ?',
    'Exporte, puis glisse le fichier sur une piste au-dessus de ta vidéo dans ton logiciel de montage. Le fond transparent laisse voir ta vidéo dessous.',
  ],
  [
    'Mon logiciel affiche un fond noir',
    "Ton logiciel ne lit pas ce format transparent. Reviens à l'étape Exporter et choisis ton logiciel dans la liste : DStudio choisit le bon format. En dernier recours, exporte sur fond vert et utilise l'effet « Incrustation ».",
  ],
  [
    'Je veux faire 10 synthés d’un coup',
    'Choisis le modèle « Synthés en lot » et colle ta liste (Nom | Fonction, une personne par ligne). Tu récupères un fichier par personne dans un .zip.',
  ],
  [
    'Comment vérifier que le texte est lisible ?',
    "Dans l'aperçu, clique sur « Ma vidéo » et glisse une capture d'écran ou directement ta vidéo : elle s'affiche derrière le titre.",
  ],
  [
    'Où sont enregistrées mes créations ?',
    "Dans ce navigateur, automatiquement. Pour les envoyer à un collègue ou changer d'ordinateur, utilise « Enregistrer le fichier projet » dans Mes créations.",
  ],
  [
    "L'export est long",
    "Le fichier est fabriqué image par image sur ton ordinateur, rien n'est envoyé sur internet. Pour aller plus vite, choisis 25 ou 30 images par seconde.",
  ],
];

export function HelpDrawer({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" aria-label="Aide" role="dialog" aria-modal="true">
        <div className="drawer-head">
          <h2>Aide</h2>
          <button className="btn" type="button" onClick={onClose} autoFocus>
            Fermer
          </button>
        </div>
        {QUESTIONS.map(([q, a]) => (
          <div className="qa" key={q}>
            <b>{q}</b>
            <p>{a}</p>
          </div>
        ))}
        <div className="qa">
          <b>Raccourcis clavier (dans l'éditeur)</b>
          <p>
            <span className="kbd">Espace</span> lecture / pause · <span className="kbd">←</span>{' '}
            <span className="kbd">→</span> image par image · <span className="kbd">Ctrl</span>+
            <span className="kbd">Z</span> annuler · <span className="kbd">Ctrl</span>+
            <span className="kbd">Maj</span>+<span className="kbd">Z</span> rétablir ·{' '}
            <span className="kbd">Ctrl</span>+<span className="kbd">E</span> exporter
          </p>
        </div>
      </aside>
    </>
  );
}
