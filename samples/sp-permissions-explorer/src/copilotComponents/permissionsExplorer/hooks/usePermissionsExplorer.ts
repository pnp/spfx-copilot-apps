import * as React from 'react';

import type { IPermissionEntry } from '../models/IPermissionEntry';
import type { IPermissionsSummary } from '../models/IPermissionsSummary';
import type { IPermissionsToolInput } from '../models/IPermissionsToolInput';
import type { IResolvedSite } from '../models/IResolvedSite';
import type { IPermissionsExplorerService } from '../services/PermissionsExplorerService';
import { HttpError } from '../utils/retryPolicy';

export type ExplorerStatus =
  | 'resolving'
  | 'multiple'
  | 'loading'
  | 'ready'
  | 'notfound'
  | 'error';

export type ExplorerErrorKind = 'accessDenied' | 'notFound' | 'throttled' | 'generic';

export interface IExplorerError {
  kind: ExplorerErrorKind;
  message: string;
}

export interface IGroupExpansionState {
  status: 'idle' | 'loading' | 'loaded' | 'denied' | 'error';
  members: IPermissionEntry[];
}

export interface IUsePermissionsExplorerResult {
  status: ExplorerStatus;
  sites: IResolvedSite[];
  selectedSite?: IResolvedSite;
  summary?: IPermissionsSummary;
  entries: IPermissionEntry[];
  error?: IExplorerError;
  expansions: Record<string, IGroupExpansionState>;
  selectSite: (site: IResolvedSite) => void;
  refresh: () => void;
  expandGroup: (entry: IPermissionEntry) => void;
  collapseGroup: (entryId: string) => void;
}

function mapErrorKind(err: unknown): ExplorerErrorKind {
  if (err instanceof HttpError) {
    if (err.status === 403) return 'accessDenied';
    if (err.status === 404) return 'notFound';
    if (err.status === 429 || err.status === 503) return 'throttled';
  }
  return 'generic';
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Unexpected error';
}

export function usePermissionsExplorer(
  service: IPermissionsExplorerService,
  toolInput: IPermissionsToolInput,
  currentWebUrl: string
): IUsePermissionsExplorerResult {
  const [status, setStatus] = React.useState<ExplorerStatus>('resolving');
  const [sites, setSites] = React.useState<IResolvedSite[]>([]);
  const [selectedSite, setSelectedSite] = React.useState<IResolvedSite | undefined>(undefined);
  const [summary, setSummary] = React.useState<IPermissionsSummary | undefined>(undefined);
  const [entries, setEntries] = React.useState<IPermissionEntry[]>([]);
  const [error, setError] = React.useState<IExplorerError | undefined>(undefined);
  const [expansions, setExpansions] = React.useState<Record<string, IGroupExpansionState>>({});

  const mountedRef = React.useRef<boolean>(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadForSite = React.useCallback(
    async (site: IResolvedSite): Promise<void> => {
      if (!mountedRef.current) return;
      setStatus('loading');
      setError(undefined);
      setExpansions({});
      try {
        const loaded = await service.getPermissions(site);
        if (!mountedRef.current) return;
        const s = await service.getSummary(site);
        if (!mountedRef.current) return;
        setEntries(loaded);
        setSummary(s);
        setStatus('ready');
      } catch (err: unknown) {
        if (!mountedRef.current) return;
        setEntries([]);
        setSummary(undefined);
        setError({ kind: mapErrorKind(err), message: toMessage(err) });
        setStatus('error');
      }
    },
    [service]
  );

  const selectSite = React.useCallback(
    (site: IResolvedSite): void => {
      setSelectedSite(site);
      loadForSite(site).catch(() => { /* errors handled internally */ });
    },
    [loadForSite]
  );

  const refresh = React.useCallback((): void => {
    if (selectedSite) {
      loadForSite(selectedSite).catch(() => { /* errors handled internally */ });
    }
  }, [loadForSite, selectedSite]);

  const expandGroup = React.useCallback(
    (entry: IPermissionEntry): void => {
      if (!selectedSite || typeof entry.principalId !== 'number') return;
      setExpansions((prev) => ({ ...prev, [entry.id]: { status: 'loading', members: [] } }));
      const site = selectedSite;
      const principalId = entry.principalId;
      const run = async (): Promise<void> => {
        try {
          const members = await service.expandGroup(site, principalId);
          if (!mountedRef.current) return;
          setExpansions((prev) => ({ ...prev, [entry.id]: { status: 'loaded', members } }));
        } catch (err: unknown) {
          if (!mountedRef.current) return;
          const denied = err instanceof HttpError && err.status === 403;
          setExpansions((prev) => ({
            ...prev,
            [entry.id]: { status: denied ? 'denied' : 'error', members: [] }
          }));
        }
      };
      run().catch(() => { /* errors handled internally */ });
    },
    [selectedSite, service]
  );

  const collapseGroup = React.useCallback((entryId: string): void => {
    setExpansions((prev) => {
      const next: Record<string, IGroupExpansionState> = { ...prev };
      delete next[entryId];
      return next;
    });
  }, []);

  const siteQuery = toolInput.siteQuery;
  const siteUrl = toolInput.siteUrl;

  React.useEffect(() => {
    let cancelled = false;
    const run = async (): Promise<void> => {
      setStatus('resolving');
      setError(undefined);
      setSites([]);
      setSelectedSite(undefined);
      setSummary(undefined);
      setEntries([]);
      setExpansions({});

      const effectiveInput: IPermissionsToolInput =
        siteQuery.trim().length === 0 && !siteUrl
          ? { siteQuery: '', siteUrl: currentWebUrl }
          : { siteQuery, siteUrl };

      try {
        const resolved = await service.resolveSites(effectiveInput);
        if (cancelled || !mountedRef.current) return;
        if (resolved.length === 0) {
          setStatus('notfound');
          return;
        }
        if (resolved.length === 1) {
          setSelectedSite(resolved[0]);
          await loadForSite(resolved[0]);
          return;
        }
        setSites(resolved);
        setStatus('multiple');
      } catch (err: unknown) {
        if (cancelled || !mountedRef.current) return;
        setError({ kind: mapErrorKind(err), message: toMessage(err) });
        setStatus('error');
      }
    };
    run().catch(() => { /* errors handled internally */ });
    return () => {
      cancelled = true;
    };
  }, [service, siteQuery, siteUrl, currentWebUrl, loadForSite]);

  return {
    status,
    sites,
    selectedSite,
    summary,
    entries,
    error,
    expansions,
    selectSite,
    refresh,
    expandGroup,
    collapseGroup
  };
}
