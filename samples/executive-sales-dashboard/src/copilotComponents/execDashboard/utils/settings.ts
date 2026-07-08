/**
 * Session-persisted dashboard settings.
 *
 * Settings are seeded from the component properties (`useMock`, `dataServiceUrl`)
 * and can be changed at runtime from the settings panel. They persist to
 * `sessionStorage` only — intentionally scoped to the current session, not saved
 * permanently — and are guarded for sandboxed hosts where storage may throw.
 */
import type { IDashboardFilters } from '../mockData/salesData';

export interface IExecDashboardSettings {
  /** Render mock data (true) or read from `dataServiceUrl` (false). */
  useMock: boolean;
  /** Endpoint used when `useMock` is false. */
  dataServiceUrl: string;
  /** Region / product / segment scope. */
  filters: IDashboardFilters;
}

const STORAGE_KEY: string = 'execDashboard.settings.v1';

/** Build the default settings from the seed values supplied by properties. */
export function createDefaultSettings(useMock: boolean, dataServiceUrl: string): IExecDashboardSettings {
  return {
    useMock,
    dataServiceUrl,
    filters: { region: 'all', product: 'all', segment: 'all' }
  };
}

/** Load settings from session storage, falling back to the provided seed. */
export function loadSettings(seed: IExecDashboardSettings): IExecDashboardSettings {
  try {
    const raw: string | null = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return seed;
    }
    const parsed: Partial<IExecDashboardSettings> = JSON.parse(raw);
    return {
      useMock: typeof parsed.useMock === 'boolean' ? parsed.useMock : seed.useMock,
      dataServiceUrl: typeof parsed.dataServiceUrl === 'string' ? parsed.dataServiceUrl : seed.dataServiceUrl,
      filters: { ...seed.filters, ...(parsed.filters ?? {}) }
    };
  } catch {
    return seed;
  }
}

/** Persist settings to session storage (guarded). */
export function saveSettings(settings: IExecDashboardSettings): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage failures in sandboxed hosts.
  }
}
