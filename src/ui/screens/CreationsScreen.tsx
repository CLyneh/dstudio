import { useRef } from 'react';
import { readFileAsText } from '@/export/download';
import { ProjectFileError } from '@/project/project';
import { useStore } from '@/state/store';
import { useToast } from '@/ui/components/Toast';
import { ProjectRows } from './ProjectRows';

export function CreationsScreen() {
  const order = useStore((s) => s.order);
  const importProject = useStore((s) => s.importProject);
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      importProject(JSON.parse(await readFileAsText(file)));
      toast('Création importée');
    } catch (error) {
      const message =
        error instanceof ProjectFileError
          ? error.message
          : "Ce fichier est illisible. Vérifie qu'il finit par .dstudio.json.";
      toast(message, 'error');
    } finally {
      if (input.current) input.current.value = '';
    }
  };

  return (
    <section className="view">
      <div className="eyebrow">Gardé dans ce navigateur</div>
      <h1 className="page-title">Mes créations</h1>
      <p className="lede">
        Chaque création est enregistrée au fil de l'eau. Rouvre-la, duplique-la pour un nouvel épisode, ou
        envoie-la à un collègue sous forme de fichier projet.
      </p>
      <div className="actions" style={{ margin: '18px 0' }}>
        <button className="btn" type="button" onClick={() => input.current?.click()}>
          Importer un fichier projet
        </button>
        <input
          ref={input}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => void onFile(e.target.files?.[0])}
          aria-label="Fichier projet à importer"
        />
      </div>
      {order.length ? (
        <ProjectRows ids={order} />
      ) : (
        <div className="empty">
          <b>Aucune création pour l'instant</b>
          <span>Tes créations apparaîtront ici dès que tu commences un modèle.</span>
          <a className="btn primary" href="#accueil">
            Choisir un modèle
          </a>
        </div>
      )}
    </section>
  );
}
