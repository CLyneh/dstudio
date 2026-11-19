import { useRef, useState } from 'react';
import { TEAM_PRESETS } from '@/brand/brand';
import { FONTS, getFont } from '@/engine/fonts';
import { slugify } from '@/engine/text';
import { downloadText, readFileAsDataUrl, readFileAsText } from '@/export/download';
import { useStore } from '@/state/store';
import { useToast } from '@/ui/components/Toast';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/svg+xml', 'image/jpeg', 'image/webp'];

export function BrandScreen() {
  const brand = useStore((s) => s.brand);
  const setBrand = useStore((s) => s.setBrand);
  const replaceBrand = useStore((s) => s.replaceBrand);
  const resetBrand = useStore((s) => s.resetBrand);
  const toast = useToast();
  const logoInput = useRef<HTMLInputElement>(null);
  const kitInput = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    if (!LOGO_TYPES.includes(file.type))
      return toast('Ce fichier n’est pas une image PNG, SVG, JPEG ou WebP.', 'error');
    if (file.size > MAX_LOGO_BYTES)
      return toast('Logo trop lourd (2 Mo maximum). Exporte-le plus petit.', 'error');
    setBrand({ logoDataUrl: await readFileAsDataUrl(file) });
    toast('Logo ajouté : il apparaît maintenant dans tous les modèles');
  };

  const onKit = async (file: File | undefined) => {
    if (!file) return;
    try {
      replaceBrand(JSON.parse(await readFileAsText(file)));
      toast('Kit de marque importé');
    } catch {
      toast("Ce fichier n'est pas un kit de marque lisible.", 'error');
    }
    if (kitInput.current) kitInput.current.value = '';
  };

  const palette = brand.palette;
  const setPaletteColor = (i: number, color: string) => {
    const next = [...palette];
    next[i] = color;
    setBrand({ palette: next, ...(i === 0 ? { accent: color } : {}) });
  };
  const font = getFont(brand.titleFontId);

  return (
    <section className="view">
      <div className="eyebrow">Couleurs, polices, logo</div>
      <h1 className="page-title">Kit de marque</h1>
      <p className="lede">
        Réglé une seule fois, utilisé par tous les modèles. Les nouvelles créations partent de ce kit ; les
        créations existantes gardent leurs propres couleurs.
      </p>
      <div className="two-col">
        <div className="card">
          <h2>Identité</h2>
          <label className="field">
            <span className="label">Nom de la marque</span>
            <input
              className="input"
              type="text"
              id="brand-name"
              value={brand.name}
              maxLength={60}
              onChange={(e) => setBrand({ name: e.target.value })}
            />
          </label>
          <div
            className={`drop ${over ? 'over' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => logoInput.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && logoInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
              void onLogo(e.dataTransfer.files[0]);
            }}
          >
            <div className="logo-prev">
              {brand.logoDataUrl ? (
                <img src={brand.logoDataUrl} alt="Logo actuel" />
              ) : (
                brand.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <b>Logo</b>
              <div className="hint">
                Clique ou glisse un PNG ou SVG, de préférence avec fond transparent (2 Mo max).
              </div>
              {brand.logoDataUrl && (
                <button
                  className="link-btn"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setBrand({ logoDataUrl: null });
                  }}
                >
                  Retirer le logo
                </button>
              )}
            </div>
          </div>
          <input
            ref={logoInput}
            type="file"
            accept={LOGO_TYPES.join(',')}
            hidden
            aria-label="Fichier du logo"
            onChange={(e) => void onLogo(e.target.files?.[0])}
          />

          <h2>Couleurs</h2>
          <p className="hint">
            La première est la couleur principale. Les autres sont proposées dans l'éditeur.
          </p>
          <div className="palette">
            {palette.map((c, i) => (
              <div className="palette-item" key={i}>
                <input
                  type="color"
                  value={c}
                  aria-label={i === 0 ? 'Couleur principale' : `Couleur ${i + 1}`}
                  onChange={(e) => setPaletteColor(i, e.target.value)}
                />
                <span>{i === 0 ? 'Principale' : c.toUpperCase()}</span>
                {i > 0 && (
                  <button
                    type="button"
                    className="remove"
                    aria-label={`Retirer la couleur ${c}`}
                    onClick={() => setBrand({ palette: palette.filter((_, j) => j !== i) })}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            {palette.length < 8 && (
              <button
                className="btn"
                type="button"
                onClick={() => setBrand({ palette: [...palette, '#ffffff'] })}
              >
                + Ajouter
              </button>
            )}
          </div>
        </div>

        <div className="card">
          <h2>Police des titres</h2>
          <select
            className="select"
            aria-label="Police des titres"
            value={brand.titleFontId}
            onChange={(e) => setBrand({ titleFontId: e.target.value })}
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
          <div className="font-sample" style={{ fontFamily: font.stack, fontWeight: 800 }}>
            Un mot, <span style={{ color: brand.accent }}>deux réponses</span>
          </div>

          <h2>Couleur du texte par défaut</h2>
          <div className="palette">
            <div className="palette-item">
              <input
                type="color"
                value={brand.textColor}
                aria-label="Couleur du texte par défaut"
                onChange={(e) => setBrand({ textColor: e.target.value })}
              />
              <span>{brand.textColor.toUpperCase()}</span>
            </div>
          </div>

          <h2>Préréglages d'équipe</h2>
          <div className="rows">
            {TEAM_PRESETS.map((p) => (
              <div className="row" key={p.id} style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
                <div>
                  <div className="row-title">{p.name}</div>
                  <div className="row-meta">{p.description}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="hint">
            Le kit et les préréglages officiels sont dans le dépôt GitHub (dossier{' '}
            <span className="mono">presets/</span>). Une modification validée arrive chez toute l'équipe au
            prochain chargement du site.
          </p>

          <div className="actions">
            <button
              className="btn"
              type="button"
              onClick={() => downloadText(JSON.stringify(brand, null, 2), `kit_${slugify(brand.name)}.json`)}
            >
              Exporter le kit
            </button>
            <button className="btn" type="button" onClick={() => kitInput.current?.click()}>
              Importer un kit
            </button>
            <input
              ref={kitInput}
              type="file"
              accept=".json,application/json"
              hidden
              aria-label="Kit de marque à importer"
              onChange={(e) => void onKit(e.target.files?.[0])}
            />
            {confirmReset ? (
              <>
                <button
                  className="btn danger"
                  type="button"
                  onClick={() => {
                    resetBrand();
                    setConfirmReset(false);
                    toast("Kit de l'équipe rétabli");
                  }}
                >
                  Confirmer
                </button>
                <button className="btn" type="button" onClick={() => setConfirmReset(false)}>
                  Annuler
                </button>
              </>
            ) : (
              <button className="btn danger" type="button" onClick={() => setConfirmReset(true)}>
                Revenir au kit de l'équipe
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
