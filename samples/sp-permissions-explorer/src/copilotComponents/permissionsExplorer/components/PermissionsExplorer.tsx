import * as React from 'react';
import {
  Badge,
  Body1,
  Button,
  FluentProvider,
  IdPrefixProvider,
  Spinner,
  Title3,
  makeStyles,
  tokens,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components';
import {
  ArrowClockwiseRegular,
  ArrowExpandRegular,
  CopyRegular,
  OpenRegular,
  ShieldRegular
} from '@fluentui/react-icons';

import type { IPermissionEntry } from '../models/IPermissionEntry';
import { usePermissionFilters } from '../hooks/usePermissionFilters';
import { usePermissionsExplorer } from '../hooks/usePermissionsExplorer';

import AccessSummaryCards from './AccessSummaryCards';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import type { IPermissionsExplorerProps } from './IPermissionsExplorerProps';
import PermissionFilters from './PermissionFilters';
import PermissionsTable from './PermissionsTable';
import PrincipalDetailsPanel from './PrincipalDetailsPanel';
import SitePicker from './SitePicker';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM,
    minHeight: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: tokens.spacingHorizontalM
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    flexGrow: 1,
    minWidth: '240px'
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
    wordBreak: 'break-all'
  },
  badgeRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap'
  },
  toolbar: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS,
    flexWrap: 'wrap',
    marginLeft: 'auto'
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacingVerticalXXL
  }
});

function buildSummaryText(
  title: string,
  webUrl: string,
  total: number,
  users: number,
  groups: number,
  external: number
): string {
  return `Access review for ${title} (${webUrl}) — ${total} principals, ${users} users, ${groups} groups, ${external} external.`;
}

function getClipboard(targetDocument: Document | undefined): Clipboard | undefined {
  const view = targetDocument?.defaultView ?? (typeof window !== 'undefined' ? window : undefined);
  return view?.navigator?.clipboard;
}

export default function PermissionsExplorer(
  props: IPermissionsExplorerProps
): React.ReactElement {
  const {
    toolInput,
    service,
    currentWebUrl,
    hostContext,
    bridge,
    onRequestDisplayMode,
    targetDocument
  } = props;
  const styles = useStyles();

  const explorer = usePermissionsExplorer(service, toolInput, currentWebUrl);
  const {
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
  } = explorer;

  const filters = usePermissionFilters(entries, toolInput.filter);
  const {
    filter,
    setFilter,
    searchText,
    setSearchText,
    externalOnly,
    setExternalOnly,
    directOnly,
    setDirectOnly,
    filteredEntries
  } = filters;

  const [selectedEntry, setSelectedEntry] = React.useState<IPermissionEntry | undefined>(undefined);
  const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false);

  const theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;

  const handleSelectRow = React.useCallback((entry: IPermissionEntry): void => {
    setSelectedEntry(entry);
    setDetailsOpen(true);
  }, []);

  const handleCloseDetails = React.useCallback((): void => {
    setDetailsOpen(false);
  }, []);

  const handleExpand = React.useCallback(async (): Promise<void> => {
    await onRequestDisplayMode('fullscreen');
  }, [onRequestDisplayMode]);

  const handleOpenSite = React.useCallback(async (): Promise<void> => {
    if (selectedSite) {
      await bridge.openLinkAsync(selectedSite.webUrl);
    }
  }, [bridge, selectedSite]);

  const handleRefresh = React.useCallback((): void => {
    refresh();
  }, [refresh]);

  const handleCopySummary = React.useCallback(async (): Promise<void> => {
    if (!summary) return;
    const text = buildSummaryText(
      summary.title,
      summary.webUrl,
      summary.totalPrincipals,
      summary.userCount,
      summary.groupCount + summary.m365GroupCount,
      summary.externalUserCount
    );
    const clipboard = getClipboard(targetDocument);
    if (clipboard) {
      try {
        await clipboard.writeText(text);
      } catch {
        // Clipboard may reject in restricted hosts; fail silently.
      }
    }
  }, [summary, targetDocument]);

  const renderBody = (): React.ReactElement => {
    if (status === 'resolving' || status === 'loading') {
      return (
        <div className={styles.center}>
          <Spinner label="Loading permissions…" />
        </div>
      );
    }
    if (status === 'multiple') {
      return <SitePicker sites={sites} onSelect={selectSite} />;
    }
    if (status === 'notfound') {
      return (
        <EmptyState
          title="No site found"
          message="No matching site was found."
          hint="Try the full site URL."
        />
      );
    }
    if (status === 'error' && error) {
      return <ErrorState kind={error.kind} message={error.message} onRetry={refresh} />;
    }
    if (status === 'ready' && summary) {
      return (
        <>
          <AccessSummaryCards summary={summary} />
          <PermissionFilters
            filter={filter}
            onFilterChange={setFilter}
            searchText={searchText}
            onSearchChange={setSearchText}
            externalOnly={externalOnly}
            onExternalOnlyChange={setExternalOnly}
            directOnly={directOnly}
            onDirectOnlyChange={setDirectOnly}
            resultCount={filteredEntries.length}
            totalCount={entries.length}
          />
          <PermissionsTable
            entries={filteredEntries}
            expansions={expansions}
            principalQuery={toolInput.principalQuery}
            service={service}
            onExpandGroup={expandGroup}
            onCollapseGroup={collapseGroup}
            onSelectRow={handleSelectRow}
          />
          <PrincipalDetailsPanel
            entry={selectedEntry}
            open={detailsOpen}
            onClose={handleCloseDetails}
          />
        </>
      );
    }
    return <></>;
  };

  return (
    <IdPrefixProvider value="permissions-explorer-">
      <FluentProvider
        theme={theme}
        targetDocument={targetDocument}
        style={{ minHeight: '100%' }}
      >
        <div className={styles.root}>
          <div className={styles.header}>
            <div className={styles.headerText}>
              <Title3>SharePoint Access Review</Title3>
              {selectedSite && (
                <>
                  <Body1>{selectedSite.title}</Body1>
                  <Body1 className={styles.subtitle}>{selectedSite.webUrl}</Body1>
                </>
              )}
              <div className={styles.badgeRow}>
                <Badge appearance="tint" color="informative" icon={<ShieldRegular />}>
                  Read-only review
                </Badge>
              </div>
            </div>
            <div className={styles.toolbar} role="toolbar" aria-label="Review actions">
              <Button
                appearance="subtle"
                icon={<ArrowClockwiseRegular />}
                aria-label="Refresh permissions"
                onClick={handleRefresh}
                disabled={!selectedSite}
              />
              <Button
                appearance="subtle"
                icon={<CopyRegular />}
                aria-label="Copy summary to clipboard"
                onClick={handleCopySummary}
                disabled={!summary}
              />
              <Button
                appearance="subtle"
                icon={<OpenRegular />}
                aria-label="Open site in new tab"
                onClick={handleOpenSite}
                disabled={!selectedSite}
              />
              <Button
                appearance="subtle"
                icon={<ArrowExpandRegular />}
                aria-label="Expand to fullscreen"
                onClick={handleExpand}
              />
            </div>
          </div>
          {renderBody()}
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
