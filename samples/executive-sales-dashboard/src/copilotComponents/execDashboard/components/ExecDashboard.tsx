import * as React from 'react';

import { createCopilotTextContent } from '@microsoft/sp-copilot-component';

import type { ICurrentUser, IDashboardData } from '../models/dashboard';
import type { IDashboardFilters } from '../mockData/salesData';
import type { IExecDashboardProps } from './IExecDashboardProps';
import { createDataService } from '../services/dataServiceFactory';
import {
  createDefaultSettings,
  loadSettings,
  saveSettings,
  type IExecDashboardSettings
} from '../utils/settings';

import ExecDashboardThemeProvider from './ExecDashboardThemeProvider';
import ExecDashboardInline from './ExecDashboardInline';
import ExecDashboardFullscreen from './ExecDashboardFullscreen';
import LoadingOverlay from './shared/LoadingOverlay';

/**
 * Root selector for the Executive Sales & Revenue Dashboard.
 *
 * Responsibilities:
 * - Owns the effective **settings** (seeded from component properties, then
 *   session-persisted and editable from the settings panel).
 * - Owns the **data-loading lifecycle**: creates the data service via the
 *   factory (mock or real, driven by `settings.useMock`), loads the dashboard
 *   payload and the current user, and exposes `isDataLoading` so a spinner is
 *   shown before the content.
 * - Picks the **experience** from `hostContext.displayMode`: `fullscreen`
 *   renders the rich dashboard, anything else renders the compact inline card.
 * - Wraps everything in a single theme provider that follows the host theme
 *   (light/dark) unless overridden in settings.
 */
export default function ExecDashboard(props: IExecDashboardProps): React.ReactElement {
  const { hostContext, bridge, targetDocument, strings, siteTitle, resolveCurrentUser, onRequestFullscreen } = props;

  const [settings, setSettings] = React.useState<IExecDashboardSettings>(() =>
    loadSettings(createDefaultSettings(props.useMock, props.dataServiceUrl))
  );
  const [data, setData] = React.useState<IDashboardData | undefined>(undefined);
  const [currentUser, setCurrentUser] = React.useState<ICurrentUser | undefined>(undefined);
  const [isDataLoading, setIsDataLoading] = React.useState<boolean>(true);
  const [refreshNonce, setRefreshNonce] = React.useState<number>(0);

  // Persist settings to session storage whenever they change.
  React.useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const { useMock, dataServiceUrl } = settings;
  const filters: IDashboardFilters = settings.filters;

  // Load dashboard data and the current user whenever the data source, filters,
  // or an explicit refresh changes. A cancellation flag avoids setting state
  // from a stale request when settings change quickly.
  React.useEffect(() => {
    let cancelled: boolean = false;
    setIsDataLoading(true);

    const service = createDataService({ useMock, dataServiceUrl });
    const now: Date = new Date();

    Promise.all([service.getDashboardData(now, filters), resolveCurrentUser(useMock)])
      .then(([loadedData, user]) => {
        if (cancelled) {
          return;
        }
        setData(loadedData);
        setCurrentUser(user);
        setIsDataLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setIsDataLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [useMock, dataServiceUrl, filters, resolveCurrentUser, refreshNonce]);

  const handleSettingsChange = React.useCallback((next: IExecDashboardSettings): void => {
    setSettings(next);
  }, []);

  const handleRefresh = React.useCallback((): void => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const handleExpand = React.useCallback(async (): Promise<void> => {
    try {
      await onRequestFullscreen();
    } catch {
      // Host may deny; nothing to do.
    }
  }, [onRequestFullscreen]);

  const handleGiveFeedback = React.useCallback(async (): Promise<void> => {
    try {
      await bridge.sendFollowUpMessageAsync([
        createCopilotTextContent(`I'd like to give feedback on the ${siteTitle} Executive Sales & Revenue Dashboard.`)
      ]);
    } catch {
      // No-op when the host is unavailable (e.g. workbench).
    }
  }, [bridge, siteTitle]);

  const handleViewDetails = React.useCallback((): void => {
    // Deep-linking is deferred; keep as a no-op in the mock sample.
  }, []);

  const isFullscreen: boolean = hostContext.displayMode === 'fullscreen';

  return (
    <ExecDashboardThemeProvider
      hostTheme={hostContext.theme}
      targetDocument={targetDocument}
    >
      {isDataLoading || !data ? (
        <LoadingOverlay label={strings.LoadingLabel} />
      ) : isFullscreen ? (
        <ExecDashboardFullscreen
          data={data}
          currentUser={currentUser}
          settings={settings}
          strings={strings}
          onSettingsChange={handleSettingsChange}
          onRefresh={handleRefresh}
          onGiveFeedback={handleGiveFeedback}
          onViewDetails={handleViewDetails}
        />
      ) : (
        <ExecDashboardInline
          data={data}
          strings={strings}
          onExpand={handleExpand}
          onGiveFeedback={handleGiveFeedback}
        />
      )}
    </ExecDashboardThemeProvider>
  );
}
