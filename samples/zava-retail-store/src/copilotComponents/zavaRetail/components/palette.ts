/**
 * Shared color tokens used both in Griffel styles and inline SVG/chart rendering.
 *
 * Each value is a CSS custom property (defined on the dashboard root in useZavaStyles)
 * so the entire UI — including SVG charts that consume these strings as fill/stroke —
 * flips between the light and dark themes automatically. The fallbacks keep colors
 * sensible if a value is ever read outside the themed root.
 */
export const palette = {
  brand: 'var(--zava-brand, #5b5fc7)',
  brandStrong: 'var(--zava-brandStrong, #4f46e5)',
  brandSoft: 'var(--zava-brandSoft, #c7d2fe)',
  brandSofter: 'var(--zava-brandSofter, #e0e7ff)',
  pageBg: 'var(--zava-pageBg, #f3f4f8)',
  surface: 'var(--zava-surface, #ffffff)',
  border: 'var(--zava-border, #e5e7eb)',
  borderSoft: 'var(--zava-borderSoft, #eef2f7)',
  ink: 'var(--zava-ink, #1f2937)',
  inkStrong: 'var(--zava-inkStrong, #111827)',
  inkMuted: 'var(--zava-inkMuted, #6b7280)',
  inkFaint: 'var(--zava-inkFaint, #9ca3af)',
  positive: 'var(--zava-positive, #16a34a)',
  positiveStrong: 'var(--zava-positiveStrong, #15803d)',
  warning: 'var(--zava-warning, #f97316)',
  bubble: 'var(--zava-bubble, #ecebff)',
  bubbleInk: 'var(--zava-bubbleInk, #3730a3)'
};

/**
 * Raw light/dark color values backing the CSS custom properties above. Consumed by
 * useZavaStyles to declare the variables on the dashboard root (light) and override
 * the relevant ones in dark mode.
 */
export const themeColors = {
  light: {
    '--zava-brand': '#5b5fc7',
    '--zava-brandStrong': '#4f46e5',
    '--zava-brandSoft': '#c7d2fe',
    '--zava-brandSofter': '#e0e7ff',
    '--zava-pageBg': '#f3f4f8',
    '--zava-surface': '#ffffff',
    '--zava-border': '#e5e7eb',
    '--zava-borderSoft': '#eef2f7',
    '--zava-ink': '#1f2937',
    '--zava-inkStrong': '#111827',
    '--zava-inkMuted': '#6b7280',
    '--zava-inkFaint': '#9ca3af',
    '--zava-positive': '#16a34a',
    '--zava-positiveStrong': '#15803d',
    '--zava-warning': '#f97316',
    '--zava-bubble': '#ecebff',
    '--zava-bubbleInk': '#3730a3'
  },
  dark: {
    '--zava-pageBg': '#0f1117',
    '--zava-surface': '#181b24',
    '--zava-border': '#2a2f3a',
    '--zava-borderSoft': '#262b37',
    '--zava-ink': '#e5e7eb',
    '--zava-inkStrong': '#f8fafc',
    '--zava-inkMuted': '#9aa3b2',
    '--zava-inkFaint': '#6b7280',
    '--zava-brandSoft': '#3730a3',
    '--zava-brandSofter': '#312e81',
    '--zava-bubble': '#312e81',
    '--zava-bubbleInk': '#c7d2fe'
  }
};


/** Per-metric accent colors keyed by the metric id coming from the data service. */
export const metricAccent: Record<string, { fg: string; bg: string }> = {
  sales: { fg: '#6d28d9', bg: '#ede9fe' },
  transactions: { fg: '#4f46e5', bg: '#e0e7ff' },
  basket: { fg: '#ea580c', bg: '#ffedd5' },
  csat: { fg: '#7c3aed', bg: '#f3e8ff' },
  nps: { fg: '#db2777', bg: '#fce7f3' },
  conversion: { fg: '#0d9488', bg: '#ccfbf1' }
};
