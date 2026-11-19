import { useState } from 'react';
import { getFormat } from '@/engine/formats';
import { downloadText } from '@/export/download';
import { PROJECT_FILE_EXTENSION, projectTitle, serializeProject } from '@/project/project';
import { slugify } from '@/engine/text';
import { useStore } from '@/state/store';
import { ProjectCanvas } from '@/ui/components/ProjectCanvas';
import { useToast } from '@/ui/components/Toast';
import { navigate } from '@/ui/hooks/useHashRoute';

const dateFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

/** List of creations with actions. `compact` hides everything but "Ouvrir". */
export function ProjectRows({ ids, compact = false }: { ids: string[]; compact?: boolean }) {
  const projects = useStore((s) => s.projects);
  const open = useStore((s) => s.openProject);
  const duplicate = useStore((s) => s.duplicateProject);
  const remove = useStore((s) => s.deleteProject);
  const toast = useToast();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <div className="rows">
      {ids.map((id) => {
        const p = projects[id];
        if (!p) return null;
        const title = projectTitle(p);
        return (
          <div className="row" key={id}>
            <ProjectCanvas project={p} animate={false} maxSide={192} className="row-thumb" label={title} />
            <div style={{ minWidth: 0 }}>
              <div className="row-title">{title}</div>
              <div className="row-meta">
                {getFormat(p.format).label} · modifié le {dateFormat.format(p.updatedAt)}
              </div>
            </div>
            <div className="row-actions">
              <button
                className="btn primary"
                type="button"
                onClick={() => {
                  open(id);
                  navigate('editeur');
                }}
              >
                Ouvrir
              </button>
              {!compact && (
                <>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      duplicate(id);
                      toast('Copie créée : prête pour le prochain épisode');
                    }}
                  >
                    Dupliquer
                  </button>
                  <button
                    className="btn"
                    type="button"
                    title="Pour l'envoyer à un collègue ou la garder ailleurs"
                    onClick={() =>
                      downloadText(serializeProject(p), `${slugify(title)}${PROJECT_FILE_EXTENSION}`)
                    }
                  >
                    Fichier projet
                  </button>
                  {confirming === id ? (
                    <>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => {
                          remove(id);
                          setConfirming(null);
                          toast('Création supprimée');
                        }}
                      >
                        Confirmer la suppression
                      </button>
                      <button className="btn" type="button" onClick={() => setConfirming(null)}>
                        Garder
                      </button>
                    </>
                  ) : (
                    <button className="btn danger" type="button" onClick={() => setConfirming(id)}>
                      Supprimer
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
