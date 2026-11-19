import { useEffect, useState } from 'react';
import { getFormat } from '@/engine/formats';
import { projectTotalDuration } from '@/project/project';
import { useCurrentProject, useStore } from '@/state/store';
import { getTemplate } from '@/templates/registry';
import { useToast } from '@/ui/components/Toast';
import { PreviewStage } from '@/ui/editor/PreviewStage';
import { StepAnimation } from '@/ui/editor/StepAnimation';
import { StepExport } from '@/ui/editor/StepExport';
import { StepStyle } from '@/ui/editor/StepStyle';
import { StepText } from '@/ui/editor/StepText';
import { usePlayback } from '@/ui/editor/usePlayback';

const STEPS = ['Texte', 'Style', 'Animation', 'Exporter'] as const;

export function EditorScreen() {
  const project = useCurrentProject();
  if (!project) {
    return (
      <section className="view">
        <div className="empty">
          <b>Aucune création ouverte</b>
          <span>Choisis un modèle sur l'accueil, ou rouvre une création existante.</span>
          <div className="actions">
            <a className="btn primary" href="#accueil">
              Choisir un modèle
            </a>
            <a className="btn" href="#creations">
              Mes créations
            </a>
          </div>
        </div>
      </section>
    );
  }
  return <Editor key={project.id} />;
}

function Editor() {
  const project = useCurrentProject()!;
  const update = useStore((s) => s.updateCurrent);
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.past.length > 0);
  const canRedo = useStore((s) => s.future.length > 0);
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [exportRequest, setExportRequest] = useState(0);
  const template = getTemplate(project.templateId);
  const playback = usePlayback(projectTotalDuration(project));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target &&
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) &&
        (target as HTMLInputElement).type !== 'range';
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === 'e') {
        e.preventDefault();
        setStep(3);
        setExportRequest((n) => n + 1);
        return;
      }
      if (mod && (key === 'z' || key === 'y') && !typing) {
        e.preventDefault();
        const redoing = key === 'y' || e.shiftKey;
        const ok = redoing ? redo() : undo();
        toast(ok ? (redoing ? 'Rétabli' : 'Annulé') : redoing ? 'Rien à rétablir' : 'Rien à annuler');
        return;
      }
      if (typing || mod) return;
      if (e.code === 'Space' && !(target instanceof HTMLButtonElement)) {
        e.preventDefault();
        playback.toggle();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        playback.stepFrames(e.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playback, undo, redo, toast]);

  return (
    <section className="view">
      <div className="editor">
        <div className="panel">
          <div className="panel-head">
            <div>
              <div className="sub">Modèle · {getFormat(project.format).label}</div>
              <h1>{template.name}</h1>
            </div>
            <div className="panel-head-tools">
              <div className="seg" role="group" aria-label="Annuler ou rétablir">
                <button
                  type="button"
                  onClick={() => undo()}
                  disabled={!canUndo}
                  title="Annuler (Ctrl+Z)"
                  aria-label="Annuler"
                >
                  ↶
                </button>
                <button
                  type="button"
                  onClick={() => redo()}
                  disabled={!canRedo}
                  title="Rétablir (Ctrl+Maj+Z)"
                  aria-label="Rétablir"
                >
                  ↷
                </button>
              </div>
              <span className="saved">● Enregistré automatiquement</span>
            </div>
          </div>

          <div className="steps" role="tablist" aria-label="Étapes">
            {STEPS.map((label, i) => (
              <button
                key={label}
                role="tab"
                type="button"
                id={`step-tab-${i}`}
                aria-selected={step === i}
                aria-controls={`step-panel-${i}`}
                onClick={() => setStep(i)}
              >
                <span className="n">{i + 1}</span>
                {label}
              </button>
            ))}
          </div>

          {/* All steps stay mounted so an export keeps running when switching tabs. */}
          {[
            <StepText key="t" project={project} />,
            <StepStyle key="s" project={project} />,
            <StepAnimation key="a" project={project} />,
            <StepExport key="e" project={project} exportRequest={exportRequest} />,
          ].map((content, i) => (
            <div
              key={i}
              className="step-body"
              role="tabpanel"
              id={`step-panel-${i}`}
              aria-labelledby={`step-tab-${i}`}
              hidden={step !== i}
            >
              {content}
            </div>
          ))}

          <div className="step-foot">
            <button className="btn" type="button" onClick={() => setStep(step - 1)} disabled={step === 0}>
              ← Retour
            </button>
            {step < STEPS.length - 1 && (
              <button className="btn primary" type="button" onClick={() => setStep(step + 1)}>
                Suivant : {STEPS[step + 1]} →
              </button>
            )}
          </div>
        </div>

        <PreviewStage project={project} playback={playback} onFormatChange={(format) => update({ format })} />
      </div>
    </section>
  );
}
