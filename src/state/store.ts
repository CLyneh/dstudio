import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { parseBrandKit, TEAM_BRAND, TEAM_PRESETS, type BrandKit } from '@/brand/brand';
import type { AnimationSettings, LogoSettings, StyleSettings } from '@/engine/types';
import type { EditingApp, ExportBackground, Fps, SeriesMode } from '@/export/targets';
import { createProject, duplicateProject, parseProject, type Project } from '@/project/project';
import type { TemplateId } from '@/templates/registry';

export const STORAGE_KEY = 'dstudio:v1';
/** Edits with the same key within this window count as one undo step (typing a word). */
const HISTORY_COALESCE_MS = 1000;
const HISTORY_LIMIT = 100;

export interface ProjectPatch {
  format?: Project['format'];
  duration?: number;
  content?: Record<string, string>;
  style?: Partial<Omit<StyleSettings, 'logo'>> & { logo?: Partial<LogoSettings> };
  animation?: Partial<AnimationSettings>;
}

export interface ExportPrefs {
  app: EditingApp;
  background: ExportBackground;
  fps: Fps;
  seriesMode: SeriesMode;
}

export interface UiPrefs {
  welcomeDismissed: boolean;
  tipDismissed: boolean;
  /** Team preset applied to new creations. */
  presetId: string | null;
}

interface PersistedState {
  projects: Record<string, Project>;
  /** Project ids, most recently edited first. */
  order: string[];
  currentId: string | null;
  brand: BrandKit;
  exportPrefs: ExportPrefs;
  ui: UiPrefs;
}

interface TransientState {
  past: Project[];
  future: Project[];
  lastHistoryKey: string | null;
  lastHistoryAt: number;
  /** Animation shown while hovering a choice, without applying it. */
  hoverAnimation: string | null;
  /** Incremented to restart the preview from 0. */
  previewRestart: number;
}

interface Actions {
  createProject(templateId: TemplateId): string;
  openProject(id: string): void;
  updateCurrent(patch: ProjectPatch, historyKey?: string): void;
  undo(): boolean;
  redo(): boolean;
  duplicateProject(id: string): string | null;
  deleteProject(id: string): void;
  importProject(json: unknown): string;
  setBrand(patch: Partial<BrandKit>): void;
  replaceBrand(json: unknown): void;
  resetBrand(): void;
  setExportPrefs(patch: Partial<ExportPrefs>): void;
  setUi(patch: Partial<UiPrefs>): void;
  setHoverAnimation(style: string | null): void;
  restartPreview(): void;
}

export type StoreState = PersistedState & TransientState & Actions;

export const DEFAULT_EXPORT_PREFS: ExportPrefs = {
  app: 'premiere',
  background: 'alpha',
  fps: 30,
  seriesMode: 'split',
};

export function applyPatch(project: Project, patch: ProjectPatch, now = Date.now()): Project {
  return {
    ...project,
    ...(patch.format ? { format: patch.format } : {}),
    ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
    content: patch.content ? { ...project.content, ...patch.content } : project.content,
    style: patch.style
      ? {
          ...project.style,
          ...patch.style,
          logo: patch.style.logo ? { ...project.style.logo, ...patch.style.logo } : project.style.logo,
        }
      : project.style,
    animation: patch.animation ? { ...project.animation, ...patch.animation } : project.animation,
    updatedAt: now,
  };
}

const touch = (order: string[], id: string) => [id, ...order.filter((x) => x !== id)];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      projects: {},
      order: [],
      currentId: null,
      brand: TEAM_BRAND,
      exportPrefs: DEFAULT_EXPORT_PREFS,
      ui: { welcomeDismissed: false, tipDismissed: false, presetId: null },
      past: [],
      future: [],
      lastHistoryKey: null,
      lastHistoryAt: 0,
      hoverAnimation: null,
      previewRestart: 0,

      createProject(templateId) {
        const { brand, ui } = get();
        const preset = TEAM_PRESETS.find((p) => p.id === ui.presetId) ?? null;
        const project = createProject(templateId, brand, preset);
        set((s) => ({
          projects: { ...s.projects, [project.id]: project },
          order: touch(s.order, project.id),
          currentId: project.id,
          past: [],
          future: [],
          lastHistoryKey: null,
        }));
        return project.id;
      },

      openProject(id) {
        if (!get().projects[id]) return;
        set({ currentId: id, past: [], future: [], lastHistoryKey: null });
      },

      updateCurrent(patch, historyKey) {
        const { currentId, projects, lastHistoryKey, lastHistoryAt, past } = get();
        const current = currentId ? projects[currentId] : undefined;
        if (!current) return;
        const now = Date.now();
        const coalesce =
          !!historyKey && historyKey === lastHistoryKey && now - lastHistoryAt < HISTORY_COALESCE_MS;
        set({
          projects: { ...projects, [current.id]: applyPatch(current, patch, now) },
          order: touch(get().order, current.id),
          past: coalesce ? past : [...past, current].slice(-HISTORY_LIMIT),
          future: [],
          lastHistoryKey: historyKey ?? null,
          lastHistoryAt: now,
        });
      },

      undo() {
        const { past, future, currentId, projects } = get();
        const current = currentId ? projects[currentId] : undefined;
        const previous = past[past.length - 1];
        if (!current || !previous) return false;
        set({
          projects: { ...projects, [current.id]: previous },
          past: past.slice(0, -1),
          future: [current, ...future],
          lastHistoryKey: null,
        });
        return true;
      },

      redo() {
        const { past, future, currentId, projects } = get();
        const current = currentId ? projects[currentId] : undefined;
        const next = future[0];
        if (!current || !next) return false;
        set({
          projects: { ...projects, [current.id]: next },
          past: [...past, current],
          future: future.slice(1),
          lastHistoryKey: null,
        });
        return true;
      },

      duplicateProject(id) {
        const source = get().projects[id];
        if (!source) return null;
        const copy = duplicateProject(source);
        set((s) => ({ projects: { ...s.projects, [copy.id]: copy }, order: touch(s.order, copy.id) }));
        return copy.id;
      },

      deleteProject(id) {
        set((s) => {
          const { [id]: _removed, ...rest } = s.projects;
          return {
            projects: rest,
            order: s.order.filter((x) => x !== id),
            currentId: s.currentId === id ? null : s.currentId,
          };
        });
      },

      importProject(json) {
        const parsed = parseProject(json, get().brand);
        // Always import as a new creation so an import never overwrites existing work.
        const project = { ...duplicateProject(parsed), createdAt: parsed.createdAt };
        set((s) => ({
          projects: { ...s.projects, [project.id]: project },
          order: touch(s.order, project.id),
        }));
        return project.id;
      },

      setBrand(patch) {
        set((s) => ({ brand: parseBrandKit({ ...s.brand, ...patch }, s.brand) }));
      },
      replaceBrand(json) {
        set((s) => ({ brand: parseBrandKit(json, s.brand) }));
      },
      resetBrand() {
        set({ brand: TEAM_BRAND });
      },
      setExportPrefs(patch) {
        set((s) => ({ exportPrefs: { ...s.exportPrefs, ...patch } }));
      },
      setUi(patch) {
        set((s) => ({ ui: { ...s.ui, ...patch } }));
      },
      setHoverAnimation(style) {
        if (get().hoverAnimation === style) return;
        set((s) => ({
          hoverAnimation: style,
          previewRestart: style ? s.previewRestart + 1 : s.previewRestart,
        }));
      },
      restartPreview() {
        set((s) => ({ previewRestart: s.previewRestart + 1 }));
      },
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): PersistedState => ({
        projects: s.projects,
        order: s.order,
        currentId: s.currentId,
        brand: s.brand,
        exportPrefs: s.exportPrefs,
        ui: s.ui,
      }),
      // Re-validate everything read from storage: an old or hand-edited save must never crash the app.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PersistedState>;
        const brand = parseBrandKit(p.brand, TEAM_BRAND);
        const projects: Record<string, Project> = {};
        for (const raw of Object.values(p.projects ?? {})) {
          try {
            const project = parseProject(raw, brand);
            projects[project.id] = project;
          } catch {
            /* drop unreadable entries */
          }
        }
        const order = (p.order ?? []).filter((id) => projects[id]);
        for (const id of Object.keys(projects)) if (!order.includes(id)) order.push(id);
        return {
          ...current,
          projects,
          order,
          currentId: p.currentId && projects[p.currentId] ? p.currentId : null,
          brand,
          exportPrefs: { ...DEFAULT_EXPORT_PREFS, ...(p.exportPrefs ?? {}) },
          ui: { ...current.ui, ...(p.ui ?? {}) },
        };
      },
    },
  ),
);

export function useCurrentProject(): Project | null {
  return useStore((s) => (s.currentId ? (s.projects[s.currentId] ?? null) : null));
}
