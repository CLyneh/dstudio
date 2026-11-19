import { useMemo } from 'react';
import { TEAM_PRESETS } from '@/brand/brand';
import { createProject } from '@/project/project';
import { useStore } from '@/state/store';
import { TEMPLATES, type TemplateId } from '@/templates/registry';
import { ProjectCanvas } from '@/ui/components/ProjectCanvas';
import { navigate } from '@/ui/hooks/useHashRoute';
import { ProjectRows } from './ProjectRows';

export function HomeScreen() {
  const brand = useStore((s) => s.brand);
  const ui = useStore((s) => s.ui);
  const setUi = useStore((s) => s.setUi);
  const create = useStore((s) => s.createProject);
  const order = useStore((s) => s.order);

  const preset = TEAM_PRESETS.find((p) => p.id === ui.presetId) ?? null;
  // Sample creations for the animated cards, following the brand kit and the selected preset.
  const samples = useMemo(
    () =>
      TEMPLATES.map((t) => ({
        template: t,
        project: { ...createProject(t.id, brand, preset, 0), format: '16:9' as const },
      })),
    [brand, preset],
  );

  const start = (id: TemplateId) => {
    create(id);
    navigate('editeur');
  };

  return (
    <section className="view">
      <div className="eyebrow">Bonjour</div>
      <h1 className="page-title">Qu'est-ce que tu veux ajouter à ta vidéo&nbsp;?</h1>
      <p className="lede">
        Choisis un modèle, tape ton texte, exporte. Le fichier sort prêt à glisser au-dessus de ta vidéo, avec
        le fond transparent.
      </p>

      {!ui.welcomeDismissed && (
        <div className="welcome" aria-label="Premiers pas">
          {[
            ['Choisis un modèle', 'Titre, chapitre, synthé… chaque carte montre le résultat.'],
            ['Personnalise', 'Texte, style et animation, avec un aperçu en direct.'],
            ['Exporte', 'Indique ton logiciel de montage, DStudio choisit le bon format.'],
          ].map(([title, text], i) => (
            <div className="welcome-step" key={title}>
              <span className="n">{i + 1}</span>
              <div>
                <b>{title}</b>
                <span>{text}</span>
              </div>
            </div>
          ))}
          <button className="link-btn" type="button" onClick={() => setUi({ welcomeDismissed: true })}>
            Compris
          </button>
        </div>
      )}

      <div className="home-toolbar">
        <h2 style={{ fontSize: 20 }}>Modèles</h2>
        <label className="field" style={{ gridAutoFlow: 'column', alignItems: 'center' }}>
          <span className="label">Préréglage d'équipe</span>
          <select
            className="select"
            value={ui.presetId ?? ''}
            onChange={(e) => setUi({ presetId: e.target.value || null })}
          >
            <option value="">Aucun (kit de marque)</option>
            {TEAM_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.description}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="tpl-grid">
        {samples.map(({ template, project }) => (
          <button key={template.id} type="button" className="tpl" onClick={() => start(template.id)}>
            <ProjectCanvas project={project} animate label={`Aperçu : ${template.name}`} />
            <div className="tpl-body">
              <b>{template.name}</b>
              <span>{template.description}</span>
              {template.isNew && <span className="chip new">Nouveau</span>}
            </div>
          </button>
        ))}
      </div>

      {order.length > 0 && (
        <>
          <div className="section-head">
            <h2>Reprendre là où tu t'es arrêté</h2>
            <a className="link-btn" href="#creations">
              Tout voir →
            </a>
          </div>
          <div style={{ marginTop: 14 }}>
            <ProjectRows ids={order.slice(0, 3)} compact />
          </div>
        </>
      )}
    </section>
  );
}
