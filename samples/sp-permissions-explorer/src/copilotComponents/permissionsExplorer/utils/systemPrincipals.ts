/**
 * Identifies the internal "Limited Access System Group" principal that
 * SharePoint uses for plumbing and hides from its own permissions UI.
 * These principals cannot be removed and must be filtered out of results.
 */
export function isLimitedAccessSystemPrincipal(title?: string): boolean {
  if (typeof title !== 'string') {
    return false;
  }
  const normalized = title.trim().toLowerCase();
  if (normalized.length === 0) {
    return false;
  }
  return (
    normalized === 'limited access system group' ||
    normalized === 'limited access system' ||
    normalized.startsWith('limited access system group for web')
  );
}
