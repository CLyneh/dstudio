import type { Position } from '@/engine/types';
import type { Project } from '@/project/project';
import { useStore } from '@/state/store';
import { getTemplate } from '@/templates/registry';
import { isFieldOn, offKey } from '@/templates/shared/optionalFields';
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
      {template.fields.map((field) => {
        const on = isFieldOn(field, project.content);
        const toggle = field.optional && (
          <label className="check" key={`${field.key}-toggle`}>
            <input
              type="checkbox"
              id={`toggle-${field.key}`}
              checked={on}
              onChange={(e) => update({ content: { [offKey(field)]: e.target.checked ? '' : '1' } })}
            />
            <span>{field.optional}</span>
          </label>
        );
        if (!on) return toggle;
        return (
          <div key={field.key} className="field-group">
            {toggle}
            <label className="field">
              <span className="label">{field.label}</span>
              {field.multiline ? (
                <textarea
                  className="textarea"
                  style={{ fontFamily: 'var(--f-ui)', fontSize: 14, minHeight: 84 }}
                  id={`field-${field.key}`}
                  value={project.content[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    update({ content: { [field.key]: e.target.value } }, `content.${field.key}`)
                  }
                />
              ) : (
                <input
                  className="input"
                  type="text"
                  id={`field-${field.key}`}
                  value={project.content[field.key] ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) =>
                    update({ content: { [field.key]: e.target.value } }, `content.${field.key}`)
                  }
                />
              )}
            </label>
          </div>
        );
      })}
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
      {template.supportsPosition && project.format !== '16:9' && (
        <div className="field">
          <span className="label">Hauteur en format vertical</span>
          <Segmented<boolean>
            label="Hauteur en format vertical"
            value={project.style.safeVertical}
            onChange={(safeVertical) => update({ style: { safeVertical } })}
            options={[
              { value: false, label: 'Comme Motion Studio' },
              { value: true, label: "Au-dessus de l'interface Reels" },
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
