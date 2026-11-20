import { DURATION_RANGE, type Project } from '@/project/project';
import { useStore } from '@/state/store';
import { getTemplate } from '@/templates/registry';
import { optionValue } from '@/templates/shared/templateOptions';

export function StepAnimation({ project }: { project: Project }) {
  const update = useStore((s) => s.updateCurrent);
  const setHover = useStore((s) => s.setHoverAnimation);
  const restart = useStore((s) => s.restartPreview);
  const template = getTemplate(project.templateId);

  return (
    <>
      <div className="field">
        <span className="label">
          Animation <span className="mono">{template.animations.length} styles</span>
        </span>
        <div className="choices" onMouseLeave={() => setHover(null)}>
          {template.animations.map((a) => (
            <button
              key={a.id}
              type="button"
              className="choice"
              aria-pressed={project.animation.style === a.id}
              onMouseEnter={() => setHover(a.id)}
              onFocus={() => setHover(a.id)}
              onBlur={() => setHover(null)}
              onClick={() => {
                update({ animation: { style: a.id } });
                restart();
              }}
            >
              {a.label}
              <small>{a.description}</small>
            </button>
          ))}
        </div>
        <span className="hint">Survole une animation pour la voir sur l'aperçu.</span>
      </div>

      {template.options
        ?.filter(
          (o) => o.step === 'animation' && (!o.forAnimation || o.forAnimation === project.animation.style),
        )
        .map((option) => {
          const current = optionValue(option, project.content);
          return (
            <div className="field" key={option.key}>
              <span className="label">{option.label}</span>
              <div className="choices">
                {option.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="choice"
                    aria-pressed={current === o.id}
                    onClick={() => {
                      update({ content: { [option.key]: o.id } });
                      restart();
                    }}
                  >
                    {o.label}
                    <small>{o.description}</small>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

      <label className="field">
        <span className="label">
          Temps à l'écran
          <span className="mono">
            {project.duration.toLocaleString('fr-FR', { minimumFractionDigits: 1 })} s
            {template.list ? ' par élément' : ''}
          </span>
        </span>
        <input
          className="range"
          type="range"
          id="duration"
          min={DURATION_RANGE.min}
          max={DURATION_RANGE.max}
          step={DURATION_RANGE.step}
          value={project.duration}
          onChange={(e) => update({ duration: Number(e.target.value) }, 'duration')}
        />
      </label>
    </>
  );
}
