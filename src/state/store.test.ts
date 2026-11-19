import { TEAM_BRAND } from '@/brand/brand';
import { useStore } from './store';

const initial = useStore.getState();

beforeEach(() => {
  localStorage.clear();
  useStore.setState(
    { ...initial, projects: {}, order: [], currentId: null, past: [], future: [], brand: TEAM_BRAND },
    true,
  );
});

const current = () => {
  const s = useStore.getState();
  return s.projects[s.currentId!]!;
};

describe('store', () => {
  it('creates and opens a project', () => {
    const id = useStore.getState().createProject('intro');
    expect(useStore.getState().currentId).toBe(id);
    expect(useStore.getState().order[0]).toBe(id);
  });

  it('undoes and redoes edits', () => {
    useStore.getState().createProject('intro');
    useStore.getState().updateCurrent({ style: { textCase: 'upper' } });
    useStore.getState().updateCurrent({ style: { textCase: 'title' } });
    expect(current().style.textCase).toBe('title');
    expect(useStore.getState().undo()).toBe(true);
    expect(current().style.textCase).toBe('upper');
    expect(useStore.getState().redo()).toBe(true);
    expect(current().style.textCase).toBe('title');
  });

  it('groups fast typing into one undo step', () => {
    useStore.getState().createProject('intro');
    const original = current().content.title;
    for (const v of ['A', 'Ab', 'Abc'])
      useStore.getState().updateCurrent({ content: { title: v } }, 'content.title');
    useStore.getState().undo();
    expect(current().content.title).toBe(original);
  });

  it('duplicates and deletes', () => {
    const id = useStore.getState().createProject('chapter');
    const copy = useStore.getState().duplicateProject(id)!;
    expect(copy).not.toBe(id);
    useStore.getState().deleteProject(id);
    expect(useStore.getState().projects[id]).toBeUndefined();
    expect(useStore.getState().currentId).toBeNull();
    expect(useStore.getState().order).toEqual([copy]);
  });

  it('imports a project file as a new creation', () => {
    const id = useStore.getState().createProject('intro');
    const json = JSON.parse(JSON.stringify(useStore.getState().projects[id]));
    const imported = useStore.getState().importProject(json);
    expect(imported).not.toBe(id);
    expect(Object.keys(useStore.getState().projects)).toHaveLength(2);
  });

  it('merges logo settings', () => {
    useStore.getState().createProject('intro');
    useStore.getState().updateCurrent({ style: { logo: { size: 1.5 } } });
    expect(current().style.logo).toMatchObject({ size: 1.5, show: true, placement: 'above-text' });
  });

  it('new projects use the edited brand kit', () => {
    useStore.getState().setBrand({ accent: '#123456', titleFontId: 'syne' });
    useStore.getState().createProject('intro');
    expect(current().style.accent).toBe('#123456');
    expect(current().style.fontId).toBe('syne');
  });

  it('persists to localStorage', () => {
    useStore.getState().createProject('end-card');
    const saved = JSON.parse(localStorage.getItem('dstudio:v1')!);
    expect(Object.keys(saved.state.projects)).toHaveLength(1);
    expect(saved.state.past).toBeUndefined();
  });
});
