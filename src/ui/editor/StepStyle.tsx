import { brandPalette } from '@/brand/brand';
import { FONTS } from '@/engine/fonts';
import { LOGO_MOTIONS, LOGO_PLACEMENTS } from '@/engine/logo';
import type { LogoMotion, LogoPlacement, TextCase } from '@/engine/types';
import { TEXT_SCALE_RANGE, VEIL_MAX, type Project } from '@/project/project';
import { useStore } from '@/state/store';
import { getTemplate } from '@/templates/registry';
import { optionValue } from '@/templates/shared/templateOptions';
import { Segmented } from '@/ui/components/Segmented';

const TEXT_COLORS = ['#ffffff', '#f8fafc', '#fde68a', '#09090b'];

export function StepStyle({ project }: { project: Project }) {
  const update = useStore((s) => s.updateCurrent);
  const brand = useStore((s) => s.brand);
  const { style } = project;
  const template = getTemplate(project.templateId);
  const palette = brandPalette(brand);
  const accents = palette.includes(style.accent) ? palette : [...palette, style.accent];
  const textColors = TEXT_COLORS.includes(style.textColor) ? TEXT_COLORS : [...TEXT_COLORS, style.textColor];

  return (
    <>
      {template.variants && (
        <div className="field">
          <span className="label">{template.variants.label}</span>
          <div className="choices">
            {template.variants.options.map((v) => (
              <button
                key={v.id}
                type="button"
                className="choice"
                aria-pressed={style.variant === v.id}
                onClick={() => update({ style: { variant: v.id } })}
              >
                {v.label}
                <small>{v.description}</small>
              </button>
            ))}
          </div>
        </div>
      )}

      {template.options?.map((option) => {
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
                  onClick={() => update({ content: { [option.key]: o.id } })}
                >
                  {o.label}
                  <small>{o.description}</small>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <ColorRow
        label="Couleur d'accent"
        colors={accents}
        value={style.accent}
        onChange={(accent, typing) => update({ style: { accent } }, typing ? 'style.accent' : undefined)}
        extra={
          <a className="link-btn" href="#marque" style={{ fontSize: 12 }}>
            Gérer le kit →
          </a>
        }
      />
      <ColorRow
        label="Couleur du texte"
        colors={textColors}
        value={style.textColor}
        onChange={(textColor, typing) =>
          update({ style: { textColor } }, typing ? 'style.textColor' : undefined)
        }
      />

      <label className="field">
        <span className="label">Police</span>
        <select
          className="select"
          id="font-select"
          value={style.fontId}
          onChange={(e) => update({ style: { fontId: e.target.value } })}
        >
          {FONTS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span className="label">Casse</span>
        <Segmented<TextCase>
          label="Casse"
          grid
          value={style.textCase}
          onChange={(textCase) => update({ style: { textCase } })}
          options={[
            { value: 'normal', label: 'Comme tapé' },
            { value: 'upper', label: 'MAJUSCULES' },
            { value: 'lower', label: 'minuscules' },
            { value: 'title', label: 'Chaque Mot' },
          ]}
        />
      </div>

      <label className="field">
        <span className="label">
          Taille du texte <span className="mono">{Math.round(style.textScale * 100)} %</span>
        </span>
        <input
          className="range"
          type="range"
          id="text-scale"
          min={TEXT_SCALE_RANGE.min * 100}
          max={TEXT_SCALE_RANGE.max * 100}
          step={5}
          value={Math.round(style.textScale * 100)}
          onChange={(e) => update({ style: { textScale: Number(e.target.value) / 100 } }, 'style.textScale')}
        />
      </label>

      <label className="field">
        <span className="label">
          Voile noir sur la vidéo <span className="mono">{Math.round(style.veil * 100)} %</span>
        </span>
        <input
          className="range"
          type="range"
          id="veil"
          min={0}
          max={VEIL_MAX * 100}
          step={5}
          value={Math.round(style.veil * 100)}
          onChange={(e) => update({ style: { veil: Number(e.target.value) / 100 } }, 'style.veil')}
        />
        <span className="hint">
          Assombrit la vidéo derrière le texte pendant l'animation. Pratique sur une image chargée.
        </span>
      </label>

      <div className="field">
        <span className="label">Vignettage (bords assombris)</span>
        <Segmented<boolean>
          label="Vignettage"
          value={style.vignette}
          onChange={(vignette) => update({ style: { vignette } })}
          options={[
            { value: false, label: 'Non' },
            { value: true, label: 'Oui' },
          ]}
        />
      </div>

      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <span className="label">
          Logo
          {!brand.logoDataUrl && (
            <a className="link-btn" href="#marque" style={{ fontSize: 12 }}>
              Ajouter le logo dans le kit →
            </a>
          )}
        </span>
        {brand.logoDataUrl ? (
          <>
            <Segmented<boolean>
              label="Afficher le logo"
              value={style.logo.show}
              onChange={(show) => update({ style: { logo: { show } } })}
              options={[
                { value: true, label: 'Afficher' },
                { value: false, label: 'Masquer' },
              ]}
            />
            {style.logo.show && (
              <div className="choices">
                <label className="field">
                  <span className="label">Position</span>
                  <select
                    className="select"
                    value={style.logo.placement}
                    onChange={(e) =>
                      update({ style: { logo: { placement: e.target.value as LogoPlacement } } })
                    }
                  >
                    {LOGO_PLACEMENTS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {project.templateId === 'playing-card' && p.id === 'above-text'
                          ? 'Dans la carte'
                          : p.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">Animation</span>
                  <select
                    className="select"
                    value={style.logo.motion}
                    onChange={(e) => update({ style: { logo: { motion: e.target.value as LogoMotion } } })}
                  >
                    {LOGO_MOTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span className="label">
                    Taille <span className="mono">{Math.round(style.logo.size * 100)} %</span>
                  </span>
                  <input
                    className="range"
                    type="range"
                    min={40}
                    max={200}
                    step={5}
                    value={Math.round(style.logo.size * 100)}
                    onChange={(e) =>
                      update({ style: { logo: { size: Number(e.target.value) / 100 } } }, 'logo.size')
                    }
                  />
                </label>
                <label className="field">
                  <span className="label">
                    Opacité <span className="mono">{Math.round(style.logo.opacity * 100)} %</span>
                  </span>
                  <input
                    className="range"
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={Math.round(style.logo.opacity * 100)}
                    onChange={(e) =>
                      update({ style: { logo: { opacity: Number(e.target.value) / 100 } } }, 'logo.opacity')
                    }
                  />
                </label>
              </div>
            )}
          </>
        ) : (
          <span className="hint">Aucun logo dans le kit de marque pour l'instant.</span>
        )}
      </fieldset>
    </>
  );
}

interface ColorRowProps {
  label: string;
  colors: string[];
  value: string;
  onChange: (color: string, typing: boolean) => void;
  extra?: React.ReactNode;
}

function ColorRow({ label, colors, value, onChange, extra }: ColorRowProps) {
  return (
    <div className="field">
      <span className="label">
        {label}
        {extra}
      </span>
      <div className="swatches">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            style={{ background: c }}
            aria-label={`${label} ${c}`}
            aria-pressed={value === c}
            onClick={() => onChange(c, false)}
          />
        ))}
        <label
          className="swatch"
          style={{ display: 'grid', placeItems: 'center', cursor: 'pointer', background: 'var(--ink-0)' }}
          title="Autre couleur"
        >
          +
          <input
            type="color"
            className="visually-hidden"
            value={value}
            aria-label={`${label} : autre couleur`}
            onChange={(e) => onChange(e.target.value, true)}
          />
        </label>
      </div>
    </div>
  );
}
