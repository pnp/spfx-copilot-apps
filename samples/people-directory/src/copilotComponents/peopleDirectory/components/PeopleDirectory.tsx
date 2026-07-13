import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
  Title3,
  Body1,
  SearchBox,
  Spinner,
  Badge,
  Button,
  Checkbox,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import type { CheckboxOnChangeData, InputOnChangeData, SearchBoxChangeEvent } from '@fluentui/react-components';
import { ArrowExpand16Regular, Chat16Regular, Mail16Regular, ResizeLarge16Regular } from '@fluentui/react-icons';
import { Persona, PersonaSize } from '@fluentui/react/lib/Persona';
import { LivePersona } from '@pnp/spfx-controls-react/lib/LivePersona';

import type { IPeopleDirectoryProps } from './IPeopleDirectoryProps';
import type { IGraphUser } from '../models/IGraphUser';
import { PeopleSearchService } from '../services/PeopleSearchService';
// import { extractSearchQuery } from '../utils/extractSearchQuery';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalM
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  },
  badges: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS
  },
  searchBox: {
    width: '100%'
  },
  filterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap',
    // SharePoint's page-level CSS resets `label { display: none }`, which
    // otherwise hides Fluent's Checkbox label (it renders as a <label>).
    '& label': {
      display: 'inline-flex',
      color: tokens.colorNeutralForeground1
    }
  },
  statusRow: {
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingVerticalM
  },
  list: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    overflow: 'hidden',
    overflowY: 'auto'
  },
  personRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalSNudge,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRight: `1px solid ${tokens.colorNeutralStroke2}`,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    minWidth: 0
  },
  personText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flexGrow: 1,
    overflow: 'hidden'
  },
  personName: {
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  personEmail: {
    color: tokens.colorBrandForegroundLink,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  personActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0
  }
});

const EXPANDED_WIDTH: number = 700;
const EXPANDED_HEIGHT: number = 500;
const COMPACT_WIDTH: number = 400;
const COMPACT_HEIGHT: number = 250;
const SEARCH_DEBOUNCE_MS: number = 400;

/**
 * People directory UI: shows a default list of tenant users on load, and
 * re-queries Microsoft Graph as the user types a first/last name into the
 * search box.
 */
export default function PeopleDirectory(props: IPeopleDirectoryProps): React.ReactElement {
  const { message, inputQuery, hostContext, msGraphClientFactory, serviceScope, onRequestDisplayMode, onRequestSizeChange, targetDocument, strings } = props;
  const styles = useStyles();

  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);
  // Seeded from the `inputQuery` tool argument Copilot extracts.
  // Heuristic `message` parsing is disabled for now:
  // () => inputQuery?.trim() || extractSearchQuery(message)
  const [searchText, setSearchText] = React.useState<string>(() => inputQuery?.trim() || '');
  const [internalOnly, setInternalOnly] = React.useState<boolean>(true);
  const [activeOnly, setActiveOnly] = React.useState<boolean>(true);
  const [users, setUsers] = React.useState<IGraphUser[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string | undefined>(undefined);

  const theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;

  const searchService = React.useMemo(
    () => new PeopleSearchService(msGraphClientFactory),
    [msGraphClientFactory]
  );

  const loadUsers = React.useCallback(async (query: string, internal: boolean, active: boolean): Promise<void> => {
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      // Always exclude shared mailboxes, resource mailboxes, and service
      // accounts, which show up as unlicensed user objects in Graph.
      const filterClauses: string[] = ['assignedLicenses/$count ne 0'];
      if (internal) {
        filterClauses.push("userType eq 'Member'");
      }
      if (active) {
        filterClauses.push('accountEnabled eq true');
      }

      searchService.searchParameter = query;
      searchService.filterParameter = filterClauses.join(' and ');
      const result = await searchService.searchUsers();
      setUsers((result.value as IGraphUser[]) || []);
    } catch {
      setUsers([]);
      setErrorMessage(strings.SearchErrorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [searchService, strings]);

  // Loads the default list immediately on mount, then re-queries on a debounce
  // as the user types or toggles a filter so we don't fire a Graph call per keystroke.
  const isFirstRun = React.useRef<boolean>(true);
  React.useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      loadUsers(searchText, internalOnly, activeOnly).catch(() => { /* handled in loadUsers */ });
      return undefined;
    }

    const handle = setTimeout(() => {
      loadUsers(searchText, internalOnly, activeOnly).catch(() => { /* handled in loadUsers */ });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchText, internalOnly, activeOnly, loadUsers]);

  const handleSearchChange = React.useCallback((_ev: SearchBoxChangeEvent, data: InputOnChangeData): void => {
    setSearchText(data.value);
  }, []);

  const handleInternalOnlyChange = React.useCallback((_ev: React.ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData): void => {
    setInternalOnly(data.checked === true);
  }, []);

  const handleActiveOnlyChange = React.useCallback((_ev: React.ChangeEvent<HTMLInputElement>, data: CheckboxOnChangeData): void => {
    setActiveOnly(data.checked === true);
  }, []);

  // Request the Copilot host to switch this component to fullscreen mode.
  const handleExpand = React.useCallback(async (): Promise<void> => {
    await onRequestDisplayMode('fullscreen');
  }, [onRequestDisplayMode]);

  // Toggle between compact and expanded sizes by requesting a resize from the host.
  const handleResize = React.useCallback(async (): Promise<void> => {
    if (isExpanded) {
      await onRequestSizeChange(COMPACT_WIDTH, COMPACT_HEIGHT);
    } else {
      await onRequestSizeChange(EXPANDED_WIDTH, EXPANDED_HEIGHT);
    }
    setIsExpanded(!isExpanded);
  }, [onRequestSizeChange, isExpanded]);

  const personEmail = (user: IGraphUser): string => user.mail || user.userPrincipalName || '';

  const handleChat = React.useCallback((user: IGraphUser): void => {
    const upn = user.userPrincipalName || user.mail;
    if (upn) {
      window.open(`https://teams.microsoft.com/l/chat/0/0?users=${encodeURIComponent(upn)}`, '_blank');
    }
  }, []);

  const handleMail = React.useCallback((user: IGraphUser): void => {
    const email = personEmail(user);
    if (email) {
      window.open(`mailto:${email}`, '_self');
    }
  }, []);

  return (
    <IdPrefixProvider value="copilot-component-">
      <FluentProvider theme={theme} targetDocument={targetDocument} style={{ minHeight: '100%' }}>
        <div className={styles.root}>
          <div className={styles.header}>
            <Title3>{strings.DirectoryTitle}</Title3>
            <div className={styles.badges}>
              <Button
                appearance="subtle"
                icon={<ResizeLarge16Regular />}
                onClick={handleResize}
                title={isExpanded ? strings.CompactButtonLabel : strings.ResizeButtonLabel}
                aria-label={isExpanded ? strings.CompactButtonLabel : strings.ResizeButtonLabel}
              />
              <Button
                appearance="subtle"
                icon={<ArrowExpand16Regular />}
                onClick={handleExpand}
                title={strings.ExpandButtonLabel}
                aria-label={strings.ExpandButtonLabel}
              />
            </div>
          </div>

          {/* TEMP DEBUG: remove once message/inputQuery wiring is verified */}
          <Body1>DEBUG message: {JSON.stringify(message)} | inputQuery: {JSON.stringify(inputQuery)}</Body1>

          <SearchBox
            className={styles.searchBox}
            placeholder={strings.SearchPlaceholder}
            value={searchText}
            onChange={handleSearchChange}
          />

          <div className={styles.filterRow}>
            <Checkbox
              label={strings.InternalUsersFilterLabel}
              checked={internalOnly}
              onChange={handleInternalOnlyChange}
            />
            <Checkbox
              label={strings.ActiveUsersFilterLabel}
              checked={activeOnly}
              onChange={handleActiveOnlyChange}
            />
          </div>

          {isLoading && (
            <div className={styles.statusRow}>
              <Spinner label={strings.LoadingLabel} />
            </div>
          )}

          {!isLoading && errorMessage && (
            <div className={styles.statusRow}>
              <Badge appearance="outline" color="danger">{errorMessage}</Badge>
            </div>
          )}

          {!isLoading && !errorMessage && users.length === 0 && (
            <div className={styles.statusRow}>
              <Body1>{strings.NoResultsMessage}</Body1>
            </div>
          )}

          {!isLoading && !errorMessage && users.length > 0 && (
            <div className={styles.list}>
              {users.map((user) => (
                <div key={user.id} className={styles.personRow}>
                  <LivePersona
                    upn={user.userPrincipalName || user.mail || ''}
                    // `@pnp/spfx-controls-react` bundles its own (older) copy of
                    // @microsoft/sp-core-library, so its `ServiceScope` type is
                    // nominally distinct from ours despite being the same object
                    // at runtime. Cast across the duplicate-package type boundary.
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    serviceScope={serviceScope as any}
                    template={
                      <Persona
                        text={user.displayName}
                        hidePersonaDetails
                        size={PersonaSize.size32}
                      />
                    }
                  />
                  <div className={styles.personText}>
                    <span className={styles.personName}>{user.displayName}</span>
                    <a className={styles.personEmail} href={`mailto:${personEmail(user)}`}>
                      {personEmail(user)}
                    </a>
                  </div>
                  <div className={styles.personActions}>
                    <Button
                      appearance="subtle"
                      icon={<Chat16Regular />}
                      onClick={() => handleChat(user)}
                      title={strings.ChatButtonLabel}
                      aria-label={strings.ChatButtonLabel}
                    />
                    <Button
                      appearance="subtle"
                      icon={<Mail16Regular />}
                      onClick={() => handleMail(user)}
                      title={strings.MailButtonLabel}
                      aria-label={strings.MailButtonLabel}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FluentProvider>
    </IdPrefixProvider>
  );
}
