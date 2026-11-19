import type { Position } from '@/engine/types';
import type { Project } from '@/project/project';
import { useStore } from '@/state/store';
import { getTemplate } from '@/templates/registry';
import { Segmented } from '@/ui/components/Segmented';

export function StepText({ project }: { project: Project }) {
  const update = useStore((s) => s.updateCurrent);
  const template = getTemplate(project.templateId);
  const count = template.list ? template.items(project.content).length : 0;

  return (
    <>
      {template.quickFills && (
        <div className="field">
          <span className="label">Modèles prêts à l'emploi</span>
          <div className="choices">
            {template.quickFills.map((q) => (
              <button
                key={q.label}
                type="button"
                className="choice"
                aria-pressed={Object.entries(q.content).every(([k, v]) => project.content[k] === v)}
                onClick={() => update({ content: q.content })}
              >
                {q.label}
                <small>{q.description}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      {template.fields.map((field) => (
        <label className="field" key={field.key}>
          <span className="label">{field.label}</span>
          {field.multiline ? (
            <textarea
              className="textarea"
              style={{ fontFamily: 'var(--f-ui)', fontSize: 14, minHeight: 84 }}
              id={`field-${field.key}`}
              value={project.content[field.key] ?? ''}
              placeholder={field.placeholder}
              onChange={(e) => update({ content: { [field.key]: e.target.value } }, `content.${field.key}`)}
            />
          ) : (
            <input
              className="input"
              type="text"
              id={`field-${field.key}`}
              value={project.content[field.key] ?? ''}
              placeholder={field.placeholder}
              onChange={(e) => update({ content: { [field.key]: e.target.value } }, `content.${field.key}`)}
            />
          )}
        </label>
      ))}
      {template.list && (
        <label className="field">
          <span className="label">
            {template.list.label}
            <span className="mono">
              {count} {template.list.itemNoun[count > 1 ? 1 : 0]}
            </span>
          </span>
          <textarea
            className="textarea"
            id="field-list"
            value={project.content.list ?? ''}
            onChange={(e) => update({ content: { list: e.target.value } }, 'content.list')}
            spellCheck={false}
          />
          <span className="hint">{template.list.hint}</span>
        </label>
      )}
      {template.supportsPosition && (
        <div className="field">
          <span className="label">Position</span>
          <Segmented<Position>
            label="Position"
            value={project.style.position}
            onChange={(position) => update({ style: { position } })}
            options={[
              { value: 'left', label: 'Gauche' },
              { value: 'center', label: 'Centre' },
              { value: 'right', label: 'Droite' },
            ]}
          />
        </div>
      )}
      <p className="hint">
        Le texte se met à jour en direct sur l'aperçu. Les lignes trop longues passent à la ligne toutes
        seules.
      </p>
    </>
  );
}
