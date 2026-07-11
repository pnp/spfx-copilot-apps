/**
 * Permission level names that SharePoint uses for internal plumbing and that
 * should be ignored when classifying user-facing access.
 */
export const IGNORED_PERMISSION_LEVELS: string[] = [
  'Limited Access',
  'Web-Only Limited Access'
];

function normalize(level: string): string {
  return (level ?? '').trim().toLowerCase();
}

function includesLevel(levels: string[], candidates: string[]): boolean {
  const set = new Set(candidates.map((c) => c.toLowerCase()));
  for (const raw of levels) {
    const n = normalize(raw);
    if (n.length === 0) {
      continue;
    }
    if (IGNORED_PERMISSION_LEVELS.map((l) => l.toLowerCase()).indexOf(n) >= 0) {
      continue;
    }
    if (set.has(n)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true when the levels collection grants Full Control.
 */
export function hasFullControl(levels: string[]): boolean {
  return includesLevel(levels, ['Full Control']);
}

/**
 * Returns true when the levels collection grants edit-equivalent access
 * (Edit, Contribute, or Design).
 */
export function hasEdit(levels: string[]): boolean {
  return includesLevel(levels, ['Edit', 'Contribute', 'Design']);
}

/**
 * Returns true when the levels collection grants read-equivalent access
 * (Read, View Only, or Restricted Read).
 */
export function hasRead(levels: string[]): boolean {
  return includesLevel(levels, ['Read', 'View Only', 'Restricted Read']);
}
