import { useEffect, useRef, useState } from 'react';
import { downloadBlob } from '@/export/download';
import { ExportCancelled, exportProject, planExport, type ExportProgress } from '@/export/exportProject';
import { resetFFmpeg } from '@/export/ffmpeg';
import {
  backgroundNote,
  EDITING_APPS,
  FPS_OPTIONS,
  getEditingApp,
  type ExportBackground,
  type Fps,
  type SeriesMode,
} from '@/export/targets';
import type { Project } from '@/project/project';
import { useStore } from '@/state/store';
import { Segmented } from '@/ui/components/Segmented';
import { useLogo } from '@/ui/hooks/useLogo';

interface Props {
  project: Project;
  /** Incremented by the Ctrl+E shortcut to start an export. */
  exportRequest: number;
}

export function StepExport({ project, exportRequest }: Props) {
  const prefs = useStore((s) => s.exportPrefs);
  const setPrefs = useStore((s) => s.setExportPrefs);
  const logo = useLogo();
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [done, setDone] = useState<{ fileName: string; clipCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const plan = planExport(project, prefs.app, prefs.background, prefs.seriesMode);
  const app = getEditingApp(prefs.app);
  const busy = progress !== null;

  const start = async () => {
    if (abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    setDone(null);
    setError(null);
    setProgress({ ratio: 0, label: 'Préparation…' });
    try {
      const result = await exportProject({
        project,
        app: prefs.app,
        background: prefs.background,
        fps: prefs.fps,
        seriesMode: prefs.seriesMode,
        logo,
        signal: controller.signal,
        onProgress: setProgress,
      });
      downloadBlob(result.blob, result.fileName);
      setDone({ fileName: result.fileName, clipCount: result.clipCount });
    } catch (e) {
      if (!(e instanceof ExportCancelled)) {
        console.error(e);
        setError(
          "L'export n'a pas abouti. Réessaie ; si ça recommence, choisis « Images PNG » ou un fond noir, et préviens l'équipe.",
        );
      }
    } finally {
      abort.current = null;
      setProgress(null);
    }
  };

  const cancel = () => {
    abort.current?.abort();
    void resetFFmpeg();
  };

  const lastRequest = useRef(exportRequest);
  useEffect(() => {
    if (exportRequest !== lastRequest.current) {
      lastRequest.current = exportRequest;
      void start();
    }
  });

  const recommended = plan.codec.id === 'mp4' ? 'MP4 (H.264)' : plan.codec.label;
  const explanation = plan.codec.id === 'mp4' ? 'Lisible partout.' : app.note;

  return (
    <>
      <div className="field">
        <span className="label">Tu montes avec quel logiciel ?</span>
        <div className="choices three">
          {EDITING_APPS.map((a) => (
            <button
              key={a.id}
              type="button"
              className="choice"
              style={{ fontSize: 12.5 }}
              aria-pressed={prefs.app === a.id}
              onClick={() => setPrefs({ app: a.id })}
              disabled={busy}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="reco" data-testid="export-recommendation">
        <b>Format : {recommended}</b>
        <span>
          {explanation} {backgroundNote(prefs.background)}
        </span>
      </div>

      <div className="field">
        <span className="label">Fond</span>
        <Segmented<ExportBackground>
          label="Fond de l'export"
          value={prefs.background}
          onChange={(background) => setPrefs({ background })}
          options={[
            { value: 'alpha', label: 'Transparent' },
            { value: 'black', label: 'Noir' },
            { value: 'green', label: 'Vert (incrustation)' },
          ]}
        />
      </div>

      <div className="field">
        <span className="label">Images par seconde</span>
        <Segmented<Fps>
          label="Images par seconde"
          value={prefs.fps}
          onChange={(fps) => setPrefs({ fps })}
          options={FPS_OPTIONS.map((f) => ({
            value: f,
            label: `${f} i/s`,
            title: f === 60 ? 'Plus fluide, export plus long' : undefined,
          }))}
        />
        <span className="hint">Prends la même valeur que ta vidéo. 30 i/s si tu ne sais pas.</span>
      </div>

      {plan.items.length > 1 && (
        <div className="field">
          <span className="label">Fichiers</span>
          <Segmented<SeriesMode>
            label="Un ou plusieurs fichiers"
            value={prefs.seriesMode}
            onChange={(seriesMode) => setPrefs({ seriesMode })}
            options={[
              { value: 'split', label: `Un fichier par élément (${plan.items.length})` },
              { value: 'single', label: 'Un seul fichier enchaîné' },
            ]}
          />
        </div>
      )}

      <div className="field">
        <span className="label">Nom du fichier</span>
        <div className="filename" data-testid="export-filename">
          {plan.fileName}
          {plan.zipped && plan.clipNames.length > 1 ? ` → ${plan.clipNames.length} fichiers` : ''}
        </div>
      </div>

      {progress && (
        <div className="field" aria-live="polite">
          <span className="label">
            <span>{progress.label}</span>
            <span className="mono">{Math.round(progress.ratio * 100)} %</span>
          </span>
          <div className="progress">
            <i style={{ width: `${progress.ratio * 100}%` }} />
          </div>
        </div>
      )}

      {done && !busy && (
        <div className="result" role="status">
          <b>C'est prêt !</b>
          <span>
            <span className="mono">{done.fileName}</span> est dans ton dossier Téléchargements.
            {done.clipCount > 1 ? ' Décompresse le .zip pour retrouver chaque fichier.' : ''} Glisse-le
            au-dessus de ta vidéo dans {app.id === 'png' || app.id === 'web' ? 'ton logiciel' : app.label}.
          </span>
        </div>
      )}
      {error && !busy && (
        <div className="error-box" role="alert">
          {error}
        </div>
      )}

      {busy ? (
        <button className="btn big" type="button" onClick={cancel}>
          Annuler l'export
        </button>
      ) : (
        <button
          className="btn primary big"
          type="button"
          onClick={() => void start()}
          data-testid="export-button"
        >
          ⬇ Exporter {plan.zipped ? 'le .zip' : 'la vidéo'}
        </button>
      )}
      <p className="hint">Tout se passe sur ton ordinateur : rien n'est envoyé sur internet.</p>
    </>
  );
}
