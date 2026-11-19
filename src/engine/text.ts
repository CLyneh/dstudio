import type { TextCase } from './types';

export type { TextCase };

export function applyCase(text: string, mode: TextCase): string {
  if (!text) return '';
  if (mode === 'upper') return text.toLocaleUpperCase('fr');
  if (mode === 'lower') return text.toLocaleLowerCase('fr');
  if (mode === 'title') {
    return text
      .toLocaleLowerCase('fr')
      .replace(/(^|[\s\-'’·•])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toLocaleUpperCase('fr'));
  }
  return text;
}

/** Splits text into lines no wider than maxWidth. A single over-long word stays on its own line. */
export function wrapText(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
  maxLines = 3,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && measure(candidate) > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`;
    return kept;
  }
  return lines;
}

/**
 * Parses "Title | subtitle" lines (one item per line). Accepts tabs too, so a two-column
 * selection pasted from Excel / Google Sheets works.
 */
export function parseListLines(text: string): [string, string][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/\s*[|\t]\s*/);
      return [(parts[0] ?? '').trim(), parts.slice(1).join(' ').trim()];
    });
}

/** "Gildas Ovono Mba" → "gildas-ovono-mba" (safe file name part). */
export function slugify(text: string, maxLength = 40): string {
  const slug = text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'sans-titre';
}
