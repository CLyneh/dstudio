export interface SegmentOption<T> {
  value: T;
  label: string;
  title?: string;
}

interface Props<T> {
  label: string;
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  id?: string;
  /** Lay options out on a 2-column grid (for long labels). */
  grid?: boolean;
}

/** A row of mutually exclusive buttons (toggle group). */
export function Segmented<T extends string | number | boolean>({
  label,
  options,
  value,
  onChange,
  id,
  grid,
}: Props<T>) {
  return (
    <div className={grid ? 'seg grid2' : 'seg'} role="group" aria-label={label} id={id}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          title={o.title}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
