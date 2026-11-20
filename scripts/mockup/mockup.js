/* Mockup UI for DStudio V1. All drawing goes through window.DStudio (the real renderer). */
(() => {
  'use strict';
  const D = window.DStudio;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- State ---------- */
  const brand = { ...D.TEAM_BRAND, palette: [...D.TEAM_BRAND.palette] };
  const logo = { image: null };
  const S = {
    tpl: 'intro',
    step: 0,
    projects: {},
    bg: 'scene',
    safe: false,
    playing: !reduced,
    loop: true,
    t: 0,
    hover: null,
    app: 'premiere',
    bgExport: 'alpha',
    exporting: false,
  };
  for (const t of D.TEMPLATES) S.projects[t.id] = D.createProject(t.id, brand, null, 0);
  const P = () => S.projects[S.tpl];
  const T = () => D.getTemplate(S.tpl);

  let undo = [];
  let redo = [];
  let lastKey = null;
  let lastAt = 0;
  function update(patch, key) {
    const now = Date.now();
    if (!(key && key === lastKey && now - lastAt < 1000)) {
      undo.push(JSON.stringify(P()));
      redo = [];
    }
    lastKey = key ?? null;
    lastAt = now;
    const p = P();
    S.projects[S.tpl] = {
      ...p,
      ...(patch.format ? { format: patch.format } : {}),
      ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
      content: { ...p.content, ...(patch.content || {}) },
      style: {
        ...p.style,
        ...(patch.style || {}),
        logo: { ...p.style.logo, ...((patch.style && patch.style.logo) || {}) },
      },
      animation: { ...p.animation, ...(patch.animation || {}) },
    };
    sync();
  }
  function restore(json) {
    S.projects[S.tpl] = JSON.parse(json);
    buildPanels();
    sync();
  }

  /* ---------- Home ---------- */
  const thumbs = [];
  function buildHome() {
    $('#tplGrid').innerHTML = '';
    for (const t of D.TEMPLATES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tpl';
      b.innerHTML = `<canvas width="480" height="270"></canvas><div class="tpl-body"><b>${esc(t.name)}</b><span>${esc(t.description)}</span>${t.id === 'playing-card' ? '<span class="tag">Motion Studio v2</span>' : t.isNew ? '<span class="tag">Nouveau</span>' : ''}</div>`;
      b.addEventListener('click', () => openEditor(t.id));
      $('#tplGrid').appendChild(b);
      thumbs.push({ id: t.id, ctx: b.querySelector('canvas').getContext('2d'), off: Math.random() * 2 });
    }
    const rows = [
      ['intro', 'Intro · Un mot, Deux réponses', '16:9 · modifié il y a 2 h'],
      ['playing-card', 'Carte à jouer · Vrai ou faux', '9:16 · modifié hier'],
      ['chapter-series', 'Série de chapitres · 3 chapitres', '16:9 · modifié lundi'],
    ];
    const row = (r, extra = '') =>
      `<div class="row"><div class="thumb">${r[2].slice(0, 4)}</div><div style="min-width:0"><div class="t">${esc(r[1])}</div><div class="m">${esc(r[2])} <span class="chip ex">Exemple</span></div></div><div class="acts"><button class="btn" type="button" data-open="${r[0]}">Ouvrir</button>${extra}</div></div>`;
    $('#recentRows').innerHTML = rows.map((r) => row(r)).join('');
    const all = rows.concat([
      ['lower-third', 'Synthé · Gildas OVONO MBA', '16:9 · modifié le 12 nov.'],
      ['lower-third-batch', 'Synthés en lot · 6 personnes', '16:9 · modifié le 10 nov.'],
    ]);
    $('#allRows').innerHTML = all
      .map((r) =>
        row(
          r,
          '<button class="btn" type="button" data-toast="Maquette : une copie serait créée, prête pour le prochain épisode">Dupliquer</button>',
        ),
      )
      .join('');
    document.addEventListener('click', (e) => {
      const o = e.target.closest('[data-open]');
      if (o) openEditor(o.dataset.open);
    });
  }

  /* ---------- Editor ---------- */
  const stage = $('#stageCanvas');
  const sctx = stage.getContext('2d');

  function openEditor(id) {
    S.tpl = id;
    S.t = 0;
    S.step = 0;
    undo = [];
    redo = [];
    location.hash = 'editeur';
    buildPanels();
    sync();
  }

  function choiceButtons(items, current, attr) {
    return items
      .map(
        (c) =>
          `<button type="button" class="choice" ${attr}="${c.id}" aria-pressed="${c.id === current}">${esc(c.label)}<small>${esc(c.description)}</small></button>`,
      )
      .join('');
  }
  const seg = (name, opts, current) =>
    `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" aria-pressed="${String(v) === String(current)}">${l}</button>`).join('')}</div>`;

  function buildPanels() {
    const t = T();
    const p = P();
    // Text
    let h = '';
    if (t.quickFills) {
      h += `<div class="field"><span class="lbl">Modèles prêts à l'emploi</span><div class="choices">${t.quickFills
        .map(
          (q, i) =>
            `<button type="button" class="choice" data-quick="${i}">${esc(q.label)}<small>${esc(q.description)}</small></button>`,
        )
        .join('')}</div></div>`;
    }
    for (const f of t.fields) {
      const v = esc(p.content[f.key]);
      const off = f.optional && p.content[f.key + 'Off'] === '1';
      if (f.optional)
        h += `<label class="check"><input type="checkbox" id="t_${f.key}" data-off="${f.key}" ${off ? '' : 'checked'}><span>${esc(f.optional)}</span></label>`;
      h += `<div class="field" id="w_${f.key}" ${off ? 'hidden' : ''}><label for="f_${f.key}">${esc(f.label)}</label>${
        f.multiline
          ? `<textarea id="f_${f.key}" data-key="${f.key}" style="font-family:var(--f-ui);font-size:14px;min-height:80px">${v}</textarea>`
          : `<input type="text" id="f_${f.key}" data-key="${f.key}" value="${v}" placeholder="${esc(f.placeholder)}">`
      }</div>`;
    }
    if (t.list)
      h += `<div class="field"><label for="f_list">${esc(t.list.label)} <span class="mono" id="countLbl"></span></label><textarea id="f_list" data-key="list">${esc(p.content.list)}</textarea><span class="hint">${esc(t.list.hint)}</span></div>`;
    if (t.supportsPosition)
      h += `<div class="field"><span class="lbl">Ancrage à l'écran</span>${seg(
        'position',
        [
          ['left', 'Gauche'],
          ['center', 'Centre'],
          ['right', 'Droite'],
        ],
        p.style.position,
      )}</div>`;
    $('#textPanel').innerHTML = h;

    // Style
    let st = '';
    if (t.variants)
      st += `<div class="field"><span class="lbl">${esc(t.variants.label)}</span><div class="choices">${choiceButtons(t.variants.options, p.style.variant, 'data-variant')}</div></div>`;
    const accents = D.brandPalette(brand);
    st += `<div class="field"><span class="lbl">Couleur d'accent <a class="link-btn" href="#marque" style="font-size:12px">Gérer le kit →</a></span><div class="swatches">${accents
      .map(
        (c) =>
          `<button type="button" class="swatch" style="background:${c}" data-accent="${c}" aria-label="Accent ${c}" aria-pressed="${c === p.style.accent}"></button>`,
      )
      .join('')}</div></div>`;
    st += `<div class="field"><span class="lbl">Couleur du texte</span><div class="swatches">${[
      '#ffffff',
      '#fde68a',
      '#09090b',
    ]
      .map(
        (c) =>
          `<button type="button" class="swatch" style="background:${c}" data-textcolor="${c}" aria-label="Texte ${c}" aria-pressed="${c === p.style.textColor}"></button>`,
      )
      .join('')}</div></div>`;
    st += `<div class="field"><label for="fontSel">Police</label><select id="fontSel">${D.FONTS.map((f) => `<option value="${f.id}" ${f.id === p.style.fontId ? 'selected' : ''}>${esc(f.label)}</option>`).join('')}</select></div>`;
    st += `<div class="field"><span class="lbl">Casse</span>${seg(
      'textCase',
      [
        ['normal', 'Comme tapé'],
        ['upper', 'MAJ.'],
        ['lower', 'min.'],
        ['title', 'Chaque Mot'],
      ],
      p.style.textCase,
    )}</div>`;
    st += `<div class="field"><label for="sizeRange">Taille du texte <span class="mono" id="sizeVal"></span></label><input class="range" type="range" id="sizeRange" min="60" max="150" step="5" value="${Math.round(p.style.textScale * 100)}"></div>`;
    st += `<div class="field"><label for="veilRange">Voile noir sur la vidéo <span class="mono" id="veilVal"></span></label><input class="range" type="range" id="veilRange" min="0" max="85" step="5" value="${Math.round(p.style.veil * 100)}"></div>`;
    st += `<div class="field"><span class="lbl">Vignettage</span>${seg(
      'vignette',
      [
        ['false', 'Non'],
        ['true', 'Oui'],
      ],
      p.style.vignette,
    )}</div>`;
    st += `<div class="field"><span class="lbl">Logo ${logo.image ? '' : '<a class="link-btn" href="#marque" style="font-size:12px">Ajouter un logo →</a>'}</span>${
      logo.image
        ? `<div class="choices"><select id="logoPlace">${D.LOGO_PLACEMENTS.map((x) => `<option value="${x.id}" ${x.id === p.style.logo.placement ? 'selected' : ''}>${esc(S.tpl === 'playing-card' && x.id === 'above-text' ? 'Dans la carte' : x.label)}</option>`).join('')}</select><select id="logoMotion">${D.LOGO_MOTIONS.map((x) => `<option value="${x.id}" ${x.id === p.style.logo.motion ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select></div>`
        : '<span class="hint">Ajoute ton logo dans le Kit de marque : il apparaîtra ici avec 4 positions et 6 animations.</span>'
    }</div>`;
    $('#stylePanel').innerHTML = st;

    // Animation
    $('#animPanel').innerHTML =
      `<div class="field"><span class="lbl">Animation <span class="mono">${t.animations.length} styles</span></span><div class="choices" id="animChoices">${choiceButtons(t.animations, p.animation.style, 'data-anim')}</div><span class="hint">Survole une animation pour la voir sur l'aperçu.</span></div>
      <div class="field"><label for="durRange">Temps à l'écran <span class="mono" id="durVal"></span></label><input class="range" type="range" id="durRange" min="15" max="100" step="5" value="${p.duration * 10}"></div>`;
  }

  function bindPanels() {
    const panel = $('.panel');
    panel.addEventListener('input', (e) => {
      const el = e.target;
      if (el.dataset.key) update({ content: { [el.dataset.key]: el.value } }, 'c.' + el.dataset.key);
      else if (el.id === 'sizeRange') update({ style: { textScale: el.value / 100 } }, 'size');
      else if (el.id === 'veilRange') update({ style: { veil: el.value / 100 } }, 'veil');
      else if (el.id === 'durRange') update({ duration: el.value / 10 }, 'dur');
    });
    panel.addEventListener('change', (e) => {
      const el = e.target;
      if (el.dataset.off) {
        update({ content: { [el.dataset.off + 'Off']: el.checked ? '' : '1' } });
        const w = document.getElementById('w_' + el.dataset.off);
        if (w) w.hidden = !el.checked;
      }
      if (el.id === 'fontSel') update({ style: { fontId: el.value } });
      if (el.id === 'logoPlace') update({ style: { logo: { placement: el.value } } });
      if (el.id === 'logoMotion') update({ style: { logo: { motion: el.value } } });
    });
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.quick !== undefined) {
        update({ content: T().quickFills[+b.dataset.quick].content });
        buildPanels();
      } else if (b.dataset.variant) update({ style: { variant: b.dataset.variant } });
      else if (b.dataset.accent) update({ style: { accent: b.dataset.accent } });
      else if (b.dataset.textcolor) update({ style: { textColor: b.dataset.textcolor } });
      else if (b.dataset.anim) {
        update({ animation: { style: b.dataset.anim } });
        S.t = 0;
      } else if (b.dataset.app) S.app = b.dataset.app;
      else if (b.dataset.v !== undefined) {
        const segEl = b.closest('[data-seg]');
        if (!segEl) return;
        const v = b.dataset.v;
        if (segEl.dataset.seg === 'position') update({ style: { position: v } });
        if (segEl.dataset.seg === 'textCase') update({ style: { textCase: v } });
        if (segEl.dataset.seg === 'vignette') update({ style: { vignette: v === 'true' } });
      }
      sync();
    });
    panel.addEventListener('mouseover', (e) => {
      const b = e.target.closest('[data-anim]');
      if (b && S.hover !== b.dataset.anim) {
        S.hover = b.dataset.anim;
        S.t = 0;
      }
    });
    panel.addEventListener('mouseout', (e) => {
      if (e.target.closest('#animChoices') && !e.relatedTarget?.closest?.('#animChoices')) S.hover = null;
    });
  }

  function segBind(el, fn) {
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button[data-v]');
      if (!b) return;
      $$('button', el).forEach((x) => x.setAttribute('aria-pressed', x === b));
      fn(b.dataset.v);
      sync();
    });
  }

  function sync() {
    const t = T();
    const p = P();
    $('#edTitle').textContent = t.name;
    $('#edTplLabel').textContent = 'Modèle · ' + p.format;
    $$('#steps button').forEach((b) => b.setAttribute('aria-selected', +b.dataset.step === S.step));
    $$('.step-body').forEach((x) => (x.hidden = +x.dataset.panel !== S.step));
    $('#prevStep').disabled = S.step === 0;
    $('#nextStep').hidden = S.step === 3;
    $$('[data-variant]').forEach((b) =>
      b.setAttribute('aria-pressed', b.dataset.variant === p.style.variant),
    );
    $$('[data-accent]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.accent === p.style.accent));
    $$('[data-textcolor]').forEach((b) =>
      b.setAttribute('aria-pressed', b.dataset.textcolor === p.style.textColor),
    );
    $$('[data-anim]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.anim === p.animation.style));
    $$('[data-app]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.app === S.app));
    $$('#ratioSeg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === p.format));
    const sv = $('#sizeVal');
    if (sv) sv.textContent = Math.round(p.style.textScale * 100) + ' %';
    const vv = $('#veilVal');
    if (vv) vv.textContent = Math.round(p.style.veil * 100) + ' %';
    const dv = $('#durVal');
    if (dv) dv.textContent = p.duration.toFixed(1).replace('.', ',') + ' s' + (t.list ? ' par élément' : '');
    const cl = $('#countLbl');
    if (cl) {
      const n = t.items(p.content).length;
      cl.textContent = `${n} ${t.list.itemNoun[n > 1 ? 1 : 0]}`;
    }
    const app = D.getEditingApp(S.app);
    const plan = D.planExport(p, S.app, S.bgExport, 'split');
    $('#reco').innerHTML =
      `<b>Format : ${esc(plan.codec.id === 'mp4' ? 'MP4 (H.264)' : plan.codec.label)}</b><span>${esc(plan.codec.id === 'mp4' ? 'Lisible partout.' : app.note)} ${esc(D.backgroundNote(S.bgExport))}</span>`;
    $('#fileName').textContent =
      plan.fileName + (plan.clipNames.length > 1 ? `  →  ${plan.clipNames.length} fichiers` : '');
    const f = D.getFormat(p.format);
    const size = D.previewSize(p.format, 960);
    if (stage.width !== size.width || stage.height !== size.height) {
      stage.width = size.width;
      stage.height = size.height;
    }
    $('#resLbl').textContent = `${f.width}×${f.height}`;
    buildTrack();
  }

  function buildTrack() {
    const t = T();
    const p = P();
    const n = t.list ? Math.max(1, t.items(p.content).length) : 1;
    const total = n * p.duration;
    const { inEnd, outStart } = t.phases(p.duration);
    const pc = (x) => ((x / total) * 100).toFixed(3) + '%';
    let h = '';
    for (let i = 0; i < n; i++) {
      const s = i * p.duration;
      h += `<div class="seg-in" style="left:${pc(s)};width:calc(${pc(inEnd)} - 1px)"></div><div class="seg-hold" style="left:${pc(s + inEnd)};width:${pc(outStart - inEnd)}"></div><div class="seg-out" style="left:${pc(s + outStart)};width:calc(${pc(p.duration - outStart)} - 2px)"></div>`;
    }
    $('#track').innerHTML = h + '<div class="head" id="head"></div>';
  }

  /* ---------- Loop ---------- */
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const route = currentRoute();
    if (route === 'accueil' && !document.hidden) {
      for (const th of thumbs) {
        const p = { ...S.projects[th.id], format: '16:9' };
        const total = D.projectTotalDuration(p);
        const tt = reduced ? Math.min(total * 0.5, 2) : (now / 1000 + th.off) % (total + 0.5);
        D.renderProjectFrame(th.ctx, 480, 270, p, tt, { background: 'scene', logo });
      }
    }
    if (route === 'editeur') {
      const base = P();
      const p = S.hover ? { ...base, animation: { style: S.hover } } : base;
      const total = D.projectTotalDuration(p);
      if (S.playing || S.hover) {
        S.t += dt;
        if (S.t > total) {
          if (S.loop || S.hover) S.t = 0;
          else {
            S.t = total;
            setPlaying(false);
          }
        }
      }
      D.renderProjectFrame(sctx, stage.width, stage.height, p, Math.min(S.t, total), {
        background: S.exporting ? 'checker' : S.bg,
        logo,
      });
      if (S.safe) D.drawSafeZones(sctx, stage.width, stage.height);
      const head = $('#head');
      if (head) head.style.left = `calc(${((S.t / total) * 100).toFixed(3)}% - 1px)`;
      $('#tc').innerHTML = `${D.formatTimecode(S.t)} <small>/ ${D.formatTimecode(total)}</small>`;
    }
    requestAnimationFrame(frame);
  }
  function setPlaying(p) {
    S.playing = p;
    $('#playBtn').textContent = p ? '❚❚' : '▶';
  }

  /* ---------- Routing ---------- */
  const ROUTES = ['accueil', 'editeur', 'marque', 'creations', 'features', 'technique'];
  function currentRoute() {
    const h = location.hash.slice(1);
    return ROUTES.includes(h) ? h : 'accueil';
  }
  function route() {
    const r = currentRoute();
    ROUTES.forEach((x) => ($('#v-' + x).hidden = x !== r));
    $$('.nav a').forEach((a) => a.removeAttribute('aria-current'));
    $$('.nav a').forEach((a) => {
      if (a.getAttribute('href') === '#' + r) a.setAttribute('aria-current', 'page');
    });
    window.scrollTo(0, 0);
  }

  /* ---------- Brand ---------- */
  function buildBrand() {
    const render = () => {
      $('#brandColors').innerHTML = brand.palette
        .map(
          (c, i) =>
            `<label class="color"><input type="color" value="${c}" data-ci="${i}" aria-label="Couleur ${i + 1}"><div><b>${i === 0 ? 'Accent' : 'Couleur ' + (i + 1)}</b><span>${c.toUpperCase()}</span></div></label>`,
        )
        .join('');
    };
    render();
    $('#brandColors').addEventListener('input', (e) => {
      const i = +e.target.dataset.ci;
      brand.palette[i] = e.target.value;
      if (i === 0) {
        brand.accent = e.target.value;
        for (const id in S.projects) S.projects[id].style.accent = e.target.value;
      }
      e.target.nextElementSibling.querySelector('span').textContent = e.target.value.toUpperCase();
      buildPanels();
    });
    $('#brandName').addEventListener('input', (e) => {
      brand.name = e.target.value;
      if (!logo.image) $('#logoPrev').textContent = (brand.name[0] || 'S').toUpperCase();
    });
    $('#logoFile').addEventListener('change', (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          logo.image = img;
          $('#logoPrev').innerHTML = '';
          $('#logoPrev').appendChild(img.cloneNode());
          buildPanels();
          toast('Logo ajouté : il apparaît maintenant dans tous les modèles');
        };
        img.src = r.result;
      };
      r.readAsDataURL(f);
    });
    const fts = $('#fontTitleSel');
    fts.innerHTML = D.FONTS.map((f) => `<option value="${f.id}">${esc(f.label)}</option>`).join('');
    fts.addEventListener('change', () => {
      const font = D.FONTS.find((f) => f.id === fts.value);
      $('#fontTitleSample').style.fontFamily = font.stack;
      brand.titleFontId = font.id;
      for (const id in S.projects) S.projects[id].style.fontId = font.id;
      buildPanels();
    });
  }

  /* ---------- Features ---------- */
  const FEATS = [
    [
      'Créer sans se perdre',
      "L'ergonomie pensée pour débuter",
      [
        [
          'v1',
          'Accueil par modèles',
          'On choisit ce qu’on veut faire avec un aperçu animé, au lieu d’un panneau plein de réglages.',
          true,
        ],
        [
          'v1',
          'Parcours en 4 étapes',
          'Texte → Style → Animation → Exporter. Un sujet par écran, boutons Suivant / Retour.',
          true,
        ],
        [
          'v1',
          'Aperçu en direct',
          'Chaque frappe se voit immédiatement, avec lecture, pause, boucle et timecode.',
          false,
        ],
        [
          'v1',
          'Ligne de temps lisible',
          "Entrée, maintien et sortie en couleurs. Clic ou glisser pour aller à n'importe quel instant.",
          true,
        ],
        ['v1', 'Annuler / rétablir', 'Ctrl+Z partout.', true],
        [
          'v1',
          'Aide intégrée et raccourcis',
          'Bouton Aide, astuces, Espace, flèches image par image, Ctrl+E.',
          true,
        ],
      ],
    ],
    [
      'Les modèles',
      'La direction artistique de Motion Studio v2, à l’identique',
      [
        [
          'v1',
          "Titre d'intro · 7 animations",
          'Split & Révélation, Mot par mot, Cinéma minimal, Impact typo, Machine à écrire, Flou cinétique, Carton éditorial.',
          false,
        ],
        [
          'v1',
          'Intertitre de chapitre · 7 animations',
          'Slide & masque, Surlignage marqueur, Mot par mot, Zoom impact, Glitch & flash, Écartement cinéma, Carton encadré.',
          false,
        ],
        [
          'v1',
          'Série de chapitres',
          'Une ligne par chapitre (Surtitre | Titre | Sous-titre), un fichier chacun ou un seul fichier enchaîné.',
          false,
        ],
        [
          'v1',
          'Synthé · 3 cartouches, 4 animations',
          'Sombre verre, Blanc éditorial, Signature ; Tiroir, Rideau, Expansion ligne, Pop élastique ; gauche / centre / droite.',
          false,
        ],
        [
          'v1',
          'Carte à jouer · 4 finitions, 4 animations 3D',
          'Noir collector, Ivoire, Néon arcade, Minimaliste ; Retournement, Tirage, Éventail, Lévitation holo. 4 cartes prêtes à l’emploi.',
          false,
        ],
        [
          'v1',
          'Synthés en lot',
          'Colle une liste (même depuis Excel), récupère un fichier par personne dans un .zip.',
          true,
        ],
        [
          'v1',
          'Écran de fin',
          'Message + appel à l’action dans la typo de l’intro, compte en étiquette.',
          true,
        ],
        [
          'v2',
          'Sous-titres animés',
          'Importer un .srt ou une transcription, style « mot par mot » façon Reels.',
          true,
        ],
      ],
    ],
    [
      'Style et marque',
      'Cohérence d’équipe sans effort',
      [
        [
          'v1',
          'Kit de marque partagé',
          'Logo, couleurs, police par défaut, stockés dans le dépôt pour toute l’équipe.',
          true,
        ],
        [
          'v1',
          '6 polices, 4 casses',
          'Inter, Montserrat, Playfair, Space Grotesk, Bebas Neue, Syne ; comme tapé, MAJ., min., Chaque Mot.',
          false,
        ],
        ['v1', 'Couleurs accent + texte', 'Palette du kit en un clic, ou n’importe quelle couleur.', false],
        ['v1', 'Voile noir & vignettage', 'Pour garder le texte lisible sur une vidéo chargée.', false],
        [
          'v1',
          'Logo animé',
          '4 positions (au-dessus, à côté de l’étiquette, filigrane, coin) et 6 animations.',
          false,
        ],
        ['v1', 'Préréglages d’équipe', 'Ex. « Reels / TikTok » : 9:16 et majuscules en un clic.', true],
      ],
    ],
    [
      'Formats et export',
      'Le fichier qui marche du premier coup',
      [
        ['v1', '4 formats', '16:9, 9:16, 1:1, 4:5, avec zones sûres Instagram / TikTok.', true],
        [
          'v1',
          'Choix guidé par logiciel',
          'Premiere, DaVinci, Final Cut, CapCut → MOV ProRes 4444 transparent ; web → WebM ; fond vert/noir → MP4 ; PNG.',
          true,
        ],
        [
          'v1',
          'Rendu image par image',
          'Animation parfaite même sur un ordinateur lent (fini l’enregistrement temps réel).',
          true,
        ],
        ['v1', 'Lots en .zip', 'Tous les chapitres ou tous les synthés d’un coup.', true],
        ['v1', 'Créations enregistrées', 'Automatiquement ; dupliquer, fichier projet à partager.', true],
      ],
    ],
  ];
  function buildFeatures() {
    $('#featGroups').innerHTML = FEATS.map(
      ([t, s, items]) =>
        `<div class="feat-group"><h2>${t} <small>${s}</small></h2><div class="feat-list">${items
          .map(
            ([v, n, d, isNew]) =>
              `<div class="feat"><div class="top"><b>${n}</b><span style="display:flex;gap:4px">${isNew && v === 'v1' ? '<span class="v new">NOUVEAU</span>' : ''}<span class="v ${v}">${v === 'v1' ? 'V1' : 'PLUS TARD'}</span></span></div><p>${d}</p></div>`,
          )
          .join('')}</div></div>`,
    ).join('');
  }

  /* ---------- Misc ---------- */
  let tt;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('on'), 2800);
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toast]');
    if (b) toast(b.dataset.toast);
  });

  function bindEditor() {
    $('#steps').addEventListener('click', (e) => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      S.step = +b.dataset.step;
      sync();
    });
    $('#prevStep').addEventListener('click', () => {
      S.step = Math.max(0, S.step - 1);
      sync();
    });
    $('#nextStep').addEventListener('click', () => {
      S.step = Math.min(3, S.step + 1);
      sync();
    });
    $('#appChoices').innerHTML = D.EDITING_APPS.map(
      (a) =>
        `<button type="button" class="choice" data-app="${a.id}" style="font-size:12.5px">${esc(a.label)}</button>`,
    ).join('');
    segBind($('#ratioSeg'), (v) => {
      update({ format: v });
      if (v === '9:16' && !S.safe) {
        S.safe = true;
        $('#safeBtn').setAttribute('aria-pressed', 'true');
        toast('Zones sûres activées : évite d’y placer du texte');
      }
    });
    segBind($('#bgSeg'), (v) => (S.bg = v));
    segBind($('#bgExportSeg'), (v) => (S.bgExport = v));
    $('#safeBtn').addEventListener('click', (e) => {
      S.safe = !S.safe;
      e.currentTarget.setAttribute('aria-pressed', S.safe);
    });
    $('#playBtn').addEventListener('click', () => setPlaying(!S.playing));
    $('#loopBtn').addEventListener('click', (e) => {
      S.loop = !S.loop;
      e.currentTarget.setAttribute('aria-pressed', S.loop);
      e.currentTarget.textContent = S.loop ? '↻ En boucle' : '→ Une fois';
    });
    const track = $('#track');
    let drag = false;
    const seek = (e) => {
      const r = track.getBoundingClientRect();
      S.t = clamp((e.clientX - r.left) / r.width, 0, 1) * D.projectTotalDuration(P());
    };
    track.addEventListener('pointerdown', (e) => {
      drag = true;
      track.setPointerCapture(e.pointerId);
      setPlaying(false);
      seek(e);
    });
    track.addEventListener('pointermove', (e) => drag && seek(e));
    track.addEventListener('pointerup', () => (drag = false));
    $('#undoBtn').addEventListener('click', doUndo);
    $('#redoBtn').addEventListener('click', doRedo);
    $('#tipClose').addEventListener('click', () => ($('#tip').hidden = true));
    $('#exportBtn').addEventListener('click', doExport);
    document.addEventListener('keydown', (e) => {
      if (currentRoute() !== 'editeur') return;
      const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        e.shiftKey ? doRedo() : doUndo();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        S.step = 3;
        sync();
        doExport();
        return;
      }
      if (typing) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPlaying(!S.playing);
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setPlaying(false);
        S.t = clamp(S.t + (e.key === 'ArrowRight' ? 1 : -1) / 30, 0, D.projectTotalDuration(P()));
      }
    });
    $('#helpBtn').addEventListener('click', () => $('#drawer').classList.add('on'));
    $('#drawerClose').addEventListener('click', () => $('#drawer').classList.remove('on'));
  }
  function doUndo() {
    if (!undo.length) return toast('Rien à annuler');
    redo.push(JSON.stringify(P()));
    restore(undo.pop());
    toast('Annulé');
  }
  function doRedo() {
    if (!redo.length) return toast('Rien à rétablir');
    undo.push(JSON.stringify(P()));
    restore(redo.pop());
    toast('Rétabli');
  }
  function doExport() {
    if (S.exporting) return;
    S.exporting = true;
    const btn = $('#exportBtn');
    btn.disabled = true;
    $('#exportProg').hidden = false;
    const frames = Math.round(D.projectTotalDuration(P()) * 30);
    const name = D.planExport(P(), S.app, S.bgExport, 'split').fileName;
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(1, p + 0.035);
      $('#exportBar').style.width = p * 100 + '%';
      $('#exportPct').textContent = Math.round(p * 100) + ' %';
      $('#exportProgText').textContent =
        p < 0.8 ? `Rendu image ${Math.round((p / 0.8) * frames)} / ${frames}…` : 'Encodage du fichier…';
      if (p >= 1) {
        clearInterval(iv);
        S.exporting = false;
        btn.disabled = false;
        setTimeout(() => {
          $('#exportProg').hidden = true;
          $('#exportBar').style.width = 0;
        }, 900);
        toast('Prêt : ' + name + ' (simulation)');
      }
    }, 50);
  }

  buildHome();
  buildPanels();
  bindPanels();
  bindEditor();
  buildBrand();
  buildFeatures();
  sync();
  setPlaying(S.playing);
  window.addEventListener('hashchange', route);
  route();
  // Make sure every title font is loaded before the first canvas frame.
  const fontLoads = document.fonts
    ? D.FONTS.flatMap((f) =>
        [500, 700, 800, 900].map((w) => document.fonts.load(`${w} 40px ${f.stack}`).catch(() => null)),
      )
    : [];
  Promise.all(fontLoads).then(() => requestAnimationFrame(frame));
})();
