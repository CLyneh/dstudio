import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { BackgroundImage, BackgroundMode } from '@/engine/backgrounds';
import { FORMATS, getFormat, previewSize, type FormatId } from '@/engine/formats';
import { drawSafeZones } from '@/engine/safeZones';
import { formatTimecode } from '@/engine/timing';
import { projectTotalDuration, type Project } from '@/project/project';
import { renderProjectFrame } from '@/project/renderProject';
import { useStore } from '@/state/store';
import { getTemplate } from '@/templates/registry';
import { Segmented } from '@/ui/components/Segmented';
import { useToast } from '@/ui/components/Toast';
import { useLogo } from '@/ui/hooks/useLogo';
import { stillFromFile } from './frameFromFile';
import { PREVIEW_FPS, type Playback } from './usePlayback';

type PreviewBackground = 'scene' | 'image' | 'checker' | 'black';

interface Props {
  project: Project;
  playback: Playback;
  onFormatChange: (format: FormatId) => void;
}

export function PreviewStage({ project, playback, onFormatChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const tcRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const logo = useLogo();
  const toast = useToast();
  const hoverAnimation = useStore((s) => s.hoverAnimation);
  const previewRestart = useStore((s) => s.previewRestart);
  const tipDismissed = useStore((s) => s.ui.tipDismissed);
  const setUi = useStore((s) => s.setUi);

  const [background, setBackground] = useState<PreviewBackground>('scene');
  const [bgImage, setBgImage] = useState<BackgroundImage | null>(null);
  const [safe, setSafe] = useState(project.format === '9:16');
  const [dragOver, setDragOver] = useState(false);

  const { width, height } = previewSize(project.format);
  const total = projectTotalDuration(project);
  const shown: Project = hoverAnimation
    ? { ...project, animation: { ...project.animation, style: hoverAnimation } }
    : project;

  // Keep the latest values in refs so the animation loop never restarts while typing.
  const live = useRef({ shown, total, background, bgImage, safe, logo, playback });
  useLayoutEffect(() => {
    live.current = { shown, total, background, bgImage, safe, logo, playback };
  });

  useEffect(() => {
    playback.seek(0);
  }, [previewRestart, playback]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let frame = 0;
    let last = -1;
    const loop = (now: number) => {
      const {
        shown: p,
        total: tot,
        background: bg,
        bgImage: img,
        safe: showSafe,
        logo: lg,
        playback: pb,
      } = live.current;
      const dt = last < 0 ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (pb.playing || useStore.getState().hoverAnimation) {
        let t = pb.timeRef.current + dt;
        if (t > tot) {
          if (pb.loop || useStore.getState().hoverAnimation) t = 0;
          else {
            t = tot;
            pb.setPlaying(false);
          }
        }
        pb.timeRef.current = t;
      }
      const t = Math.min(pb.timeRef.current, tot);
      const mode: BackgroundMode = bg === 'image' ? 'image' : bg;
      renderProjectFrame(ctx, canvas.width, canvas.height, p, t, {
        background: mode,
        backgroundImage: img,
        logo: lg,
      });
      if (showSafe) drawSafeZones(ctx, canvas.width, canvas.height);
      if (headRef.current) headRef.current.style.left = `calc(${((t / tot) * 100).toFixed(3)}% - 1px)`;
      if (tcRef.current) tcRef.current.textContent = formatTimecode(t, PREVIEW_FPS);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, []);

  const loadBackground = async (file: File | undefined) => {
    if (!file) return;
    try {
      setBgImage(await stillFromFile(file));
      setBackground('image');
      toast('Ta vidéo est en fond de l’aperçu (elle ne sera pas exportée)');
    } catch {
      toast('Fichier non reconnu : glisse une image (PNG, JPG) ou une vidéo (MP4, MOV).', 'error');
    }
  };

  const changeFormat = (format: FormatId) => {
    onFormatChange(format);
    if (format === '9:16' && !safe) {
      setSafe(true);
      toast('Zones sûres activées : évite d’y placer du texte');
    }
  };

  const seekFromPointer = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    if (!r) return;
    playback.seek(((clientX - r.left) / r.width) * total);
  };

  return (
    <div className="stage">
      <div className="stage-bar">
        <div className="grp">
          <Segmented
            label="Format"
            value={project.format}
            onChange={changeFormat}
            options={FORMATS.map((f) => ({ value: f.id, label: f.label, title: f.usage }))}
          />
        </div>
        <div className="grp">
          <Segmented<PreviewBackground>
            label="Fond de l'aperçu"
            value={background}
            onChange={(v) => (v === 'image' && !bgImage ? fileRef.current?.click() : setBackground(v))}
            options={[
              { value: 'scene', label: 'Exemple', title: 'Une image de démonstration' },
              { value: 'image', label: 'Ma vidéo', title: 'Glisse une capture ou une vidéo' },
              { value: 'checker', label: 'Transparent' },
              { value: 'black', label: 'Noir' },
            ]}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/*"
            hidden
            aria-label="Image ou vidéo de fond pour l'aperçu"
            onChange={(e) => void loadBackground(e.target.files?.[0])}
          />
          <button className="btn" type="button" aria-pressed={safe} onClick={() => setSafe(!safe)}>
            {safe ? '▣' : '▢'} Zones sûres
          </button>
        </div>
      </div>

      <div
        className={`viewport ${dragOver ? 'over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void loadBackground(e.dataTransfer.files[0]);
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          data-testid="preview-canvas"
          aria-label={`Aperçu : ${getTemplate(project.templateId).name}`}
          role="img"
        />
        {dragOver && <div className="drop-hint">Dépose ton image ou ta vidéo pour la voir en fond</div>}
      </div>

      <div className="transport">
        <button
          className="play"
          type="button"
          aria-label={playback.playing ? 'Pause' : 'Lecture'}
          onClick={playback.toggle}
        >
          {playback.playing ? '❚❚' : '▶'}
        </button>
        <span className="tc mono">
          <span ref={tcRef}>00:00:00</span> <small>/ {formatTimecode(total, PREVIEW_FPS)}</small>
        </span>
        <div
          ref={trackRef}
          className="track"
          role="slider"
          aria-label="Ligne de temps"
          aria-valuemin={0}
          aria-valuemax={Math.round(total * 10) / 10}
          tabIndex={0}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            playback.setPlaying(false);
            seekFromPointer(e.clientX);
          }}
          onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e.clientX)}
        >
          <TimelinePhases project={project} />
          <div ref={headRef} className="head" />
        </div>
        <button
          className="btn loop"
          type="button"
          aria-pressed={playback.loop}
          onClick={() => playback.setLoop(!playback.loop)}
        >
          {playback.loop ? '↻ En boucle' : '→ Une fois'}
        </button>
      </div>
      <div className="legend">
        <span>
          <i style={{ background: 'rgba(127,178,255,.6)' }} />
          Entrée
        </span>
        <span>
          <i style={{ background: 'rgba(242,193,78,.45)' }} />
          Reste à l'écran
        </span>
        <span>
          <i style={{ background: 'rgba(255,93,98,.55)' }} />
          Sortie
        </span>
        <span className="res mono">
          Export {getFormat(project.format).width}×{getFormat(project.format).height}
        </span>
      </div>
      {!tipDismissed && (
        <div className="tip">
          <span>
            Astuce : <span className="kbd">Espace</span> lance ou met en pause, <span className="kbd">←</span>{' '}
            <span className="kbd">→</span> avancent image par image. Glisse une capture de ta vidéo sur
            l'aperçu pour juger la lisibilité.
          </span>
          <button className="link-btn" type="button" onClick={() => setUi({ tipDismissed: true })}>
            OK
          </button>
        </div>
      )}
    </div>
  );
}

function TimelinePhases({ project }: { project: Project }) {
  const template = getTemplate(project.templateId);
  const count = template.list ? Math.max(1, template.items(project.content).length) : 1;
  const total = count * project.duration;
  const { inEnd, outStart } = template.phases(project.duration);
  const pct = (s: number) => `${((s / total) * 100).toFixed(3)}%`;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const start = i * project.duration;
        return (
          <span key={i}>
            <span className="ph in" style={{ left: pct(start), width: `calc(${pct(inEnd)} - 1px)` }} />
            <span className="ph hold" style={{ left: pct(start + inEnd), width: pct(outStart - inEnd) }} />
            <span
              className="ph out"
              style={{
                left: pct(start + outStart),
                width: `calc(${pct(project.duration - outStart)} - 2px)`,
              }}
            />
          </span>
        );
      })}
    </>
  );
}
