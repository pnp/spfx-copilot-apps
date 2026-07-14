import * as React from 'react';
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  ChevronDownRegular,
  ChevronRightRegular,
  InfoRegular,
  MoreHorizontalRegular,
  PersonDeleteRegular,
  WarningRegular
} from '@fluentui/react-icons';

import type { IPermissionEntry, PrincipalType } from '../models/IPermissionEntry';
import type { IPendingWriteAction } from '../models/IWriteAction';
import type { IPermissionsExplorerService } from '../services/PermissionsExplorerService';
import type { IGroupExpansionState } from '../hooks/usePermissionsExplorer';

export interface IPermissionsTableProps {
  entries: IPermissionEntry[];
  expansions: Record<string, IGroupExpansionState>;
  principalQuery?: string;
  service: IPermissionsExplorerService;
  canManage: boolean;
  onExpandGroup: (entry: IPermissionEntry) => void;
  onCollapseGroup: (entryId: string) => void;
  onSelectRow: (entry: IPermissionEntry) => void;
  onRequestAction: (action: IPendingWriteAction) => void;
}

type BadgeColor =
  | 'brand'
  | 'informative'
  | 'subtle'
  | 'success'
  | 'warning'
  | 'danger'
  | 'important';

const useStyles = makeStyles({
  root: {
    width: '100%',
    overflowX: 'auto'
  },
  secondary: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200
  },
  matchRow: {
    backgroundColor: tokens.colorBrandBackground2,
    borderLeft: `3px solid ${tokens.colorBrandStroke1}`
  },
  memberRow: {
    backgroundColor: tokens.colorNeutralBackground2
  },
  memberCell: {
    paddingLeft: tokens.spacingHorizontalXXL
  },
  memberMarker: {
    color: tokens.colorNeutralForeground3,
    marginRight: tokens.spacingHorizontalXS
  },
  levelList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalXS
  },
  empty: {
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  },
  inlineNote: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground2
  }
});

function principalTypeColor(type: PrincipalType): BadgeColor {
  switch (type) {
    case 'User':
      return 'brand';
    case 'ExternalUser':
      return 'warning';
    case 'SharePointGroup':
      return 'informative';
    case 'Microsoft365Group':
      return 'success';
    case 'SecurityGroup':
      return 'important';
    default:
      return 'subtle';
  }
}

function principalTypeLabel(type: PrincipalType): string {
  switch (type) {
    case 'User':
      return 'User';
    case 'ExternalUser':
      return 'External user';
    case 'SharePointGroup':
      return 'SharePoint group';
    case 'Microsoft365Group':
      return 'M365 group';
    case 'SecurityGroup':
      return 'Security group';
    default:
      return 'Unknown';
  }
}

function sourceColor(source: IPermissionEntry['source']): BadgeColor {
  switch (source) {
    case 'Direct':
      return 'brand';
    case 'SharePointGroup':
      return 'informative';
    case 'Microsoft365Group':
      return 'success';
    default:
      return 'subtle';
  }
}

export const PermissionsTable: React.FC<IPermissionsTableProps> = (props) => {
  const {
    entries,
    expansions,
    principalQuery,
    service,
    canManage,
    onExpandGroup,
    onCollapseGroup,
    onSelectRow,
    onRequestAction
  } = props;
  const styles = useStyles();

  const hasQuery: boolean = !!principalQuery && principalQuery.trim().length > 0;

  const isMatch = React.useCallback(
    (entry: IPermissionEntry): boolean => {
      if (!hasQuery || !principalQuery) return false;
      if (service.matchesPrincipal(entry, principalQuery)) return true;
      const state = expansions[entry.id];
      if (state && state.status === 'loaded') {
        for (const m of state.members) {
          if (service.matchesPrincipal(m, principalQuery)) return true;
        }
      }
      return false;
    },
    [hasQuery, principalQuery, service, expansions]
  );

  if (entries.length === 0) {
    return (
      <div className={styles.empty} role="status">
        <Body1>No permissions match the current filters.</Body1>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <Table aria-label="Site permissions" size="small">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Principal</TableHeaderCell>
            <TableHeaderCell>Type</TableHeaderCell>
            <TableHeaderCell>Permission levels</TableHeaderCell>
            <TableHeaderCell>Source</TableHeaderCell>
            <TableHeaderCell>Actions</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const expansion = expansions[entry.id];
            const isExpanded = expansion !== undefined && expansion.status !== 'idle';
            const matched = isMatch(entry);
            const rowClass = matched ? styles.matchRow : undefined;

            return (
              <React.Fragment key={entry.id}>
                <TableRow className={rowClass}>
                  <TableCell>
                    <div>
                      <Body1>{entry.displayName}</Body1>
                      {(entry.email || entry.loginName) && (
                        <div className={styles.secondary}>
                          {entry.email ?? entry.loginName}
                        </div>
                      )}
                      {matched && (
                        <Badge appearance="tint" color="brand" size="small">
                          Match
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge appearance="tint" color={principalTypeColor(entry.principalType)}>
                      {principalTypeLabel(entry.principalType)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.permissionLevels.length === 0 ? (
                      <Caption1>via group</Caption1>
                    ) : (
                      <div className={styles.levelList}>
                        {entry.permissionLevels.map((level) => (
                          <Badge key={level} appearance="outline">
                            {level}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge appearance="tint" color={sourceColor(entry.source)}>
                      {entry.source}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={styles.actions}>
                      {entry.isGroupExpandable && (
                        <Button
                          appearance="subtle"
                          size="small"
                          icon={isExpanded ? <ChevronDownRegular /> : <ChevronRightRegular />}
                          aria-label={isExpanded ? 'Collapse group members' : 'Expand group members'}
                          onClick={() => {
                            if (isExpanded) onCollapseGroup(entry.id);
                            else onExpandGroup(entry);
                          }}
                        />
                      )}
                      <Button
                        appearance="subtle"
                        size="small"
                        icon={<InfoRegular />}
                        aria-label={`View details for ${entry.displayName}`}
                        onClick={() => onSelectRow(entry)}
                      />
                      {canManage && (() => {
                        const isSpGroup = entry.principalType === 'SharePointGroup'
                          && typeof entry.principalId === 'number';
                        const hasDirect = entry.source === 'Direct'
                          || entry.permissionLevels.some((l) => l !== 'Limited Access');
                        if (!isSpGroup && !hasDirect) return null;
                        const firstLevel = entry.permissionLevels.find((l) => l !== 'Limited Access')
                          ?? entry.permissionLevels[0] ?? '';
                        return (
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<MoreHorizontalRegular />}
                                aria-label={`Manage ${entry.displayName}`}
                              />
                            </MenuTrigger>
                            <MenuPopover>
                              <MenuList>
                                {isSpGroup && (
                                  <MenuItem
                                    onClick={() => onRequestAction({ operation: 'addToSharePointGroup', entry })}
                                  >
                                    Add member
                                  </MenuItem>
                                )}
                                {!isSpGroup && hasDirect && (
                                  <MenuItem
                                    onClick={() => onRequestAction({
                                      operation: 'changePermissionLevel',
                                      entry,
                                      fromRoleName: firstLevel
                                    })}
                                  >
                                    Change permission level
                                  </MenuItem>
                                )}
                                <MenuItem
                                  onClick={() => onRequestAction({ operation: 'removeAccess', entry })}
                                >
                                  Remove access
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        );
                      })()}
                    </div>
                  </TableCell>
                </TableRow>

                {expansion && expansion.status === 'loading' && (
                  <TableRow className={styles.memberRow}>
                    <TableCell colSpan={5} className={styles.memberCell}>
                      <Spinner size="tiny" label="Loading members" />
                    </TableCell>
                  </TableRow>
                )}

                {expansion && expansion.status === 'denied' && (
                  <TableRow className={styles.memberRow}>
                    <TableCell colSpan={5} className={styles.memberCell}>
                      <div className={styles.inlineNote}>
                        <Badge appearance="tint" color="warning" icon={<WarningRegular />}>
                          Restricted
                        </Badge>
                        <Body1>Not expandable with current permissions</Body1>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {expansion && expansion.status === 'error' && (
                  <TableRow className={styles.memberRow}>
                    <TableCell colSpan={5} className={styles.memberCell}>
                      <div className={styles.inlineNote}>
                        <Badge appearance="tint" color="danger" icon={<WarningRegular />}>
                          Error
                        </Badge>
                        <Body1>Could not load members</Body1>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {expansion &&
                  expansion.status === 'loaded' &&
                  expansion.members.map((member) => {
                    const memberMatched = hasQuery && !!principalQuery &&
                      service.matchesPrincipal(member, principalQuery);
                    return (
                      <TableRow
                        key={`${entry.id}::${member.id}`}
                        className={memberMatched ? styles.matchRow : styles.memberRow}
                      >
                        <TableCell className={styles.memberCell}>
                          <span className={styles.memberMarker} aria-hidden="true">
                            ↳
                          </span>
                          <Body1>{member.displayName}</Body1>
                          {(member.email || member.loginName) && (
                            <div className={styles.secondary}>
                              {member.email ?? member.loginName}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge appearance="tint" color={principalTypeColor(member.principalType)}>
                            {principalTypeLabel(member.principalType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Caption1>via {entry.displayName}</Caption1>
                        </TableCell>
                        <TableCell>
                          <Badge appearance="tint" color={sourceColor(member.source)}>
                            {member.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={styles.actions}>
                            <Button
                              appearance="subtle"
                              size="small"
                              icon={<InfoRegular />}
                              aria-label={`View details for ${member.displayName}`}
                              onClick={() => onSelectRow(member)}
                            />
                            {canManage
                              && typeof entry.principalId === 'number'
                              && typeof member.principalId === 'number' && (
                              <Button
                                appearance="subtle"
                                size="small"
                                icon={<PersonDeleteRegular />}
                                aria-label={`Remove ${member.displayName} from ${entry.displayName}`}
                                onClick={() => onRequestAction({
                                  operation: 'removeFromSharePointGroup',
                                  entry,
                                  member
                                })}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default React.memo(PermissionsTable);
