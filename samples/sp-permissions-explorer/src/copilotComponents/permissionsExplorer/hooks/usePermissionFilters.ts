import * as React from 'react';

import type { IPermissionEntry } from '../models/IPermissionEntry';
import type { PermissionFilter } from '../models/IPermissionsToolInput';
import { hasEdit, hasFullControl, hasRead } from '../utils/permissionLevels';

const DEBOUNCE_MS = 250;

export interface IUsePermissionFiltersResult {
  filter: PermissionFilter;
  setFilter: (value: PermissionFilter) => void;
  searchText: string;
  setSearchText: (value: string) => void;
  externalOnly: boolean;
  setExternalOnly: (value: boolean) => void;
  directOnly: boolean;
  setDirectOnly: (value: boolean) => void;
  filteredEntries: IPermissionEntry[];
}

function passesFilter(entry: IPermissionEntry, filter: PermissionFilter): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'users':
      return entry.principalType === 'User' || entry.principalType === 'ExternalUser';
    case 'groups':
      return (
        entry.principalType === 'SharePointGroup' ||
        entry.principalType === 'Microsoft365Group' ||
        entry.principalType === 'SecurityGroup'
      );
    case 'externalUsers':
      return entry.isExternal === true;
    case 'fullControl':
      return hasFullControl(entry.permissionLevels);
    case 'edit':
      return hasEdit(entry.permissionLevels);
    case 'read':
      return hasRead(entry.permissionLevels);
    case 'directOnly':
      return entry.source === 'Direct';
    default:
      return true;
  }
}

function matchesSearch(entry: IPermissionEntry, needle: string): boolean {
  if (needle.length === 0) return true;
  if (entry.displayName.toLowerCase().indexOf(needle) >= 0) return true;
  if (entry.email && entry.email.toLowerCase().indexOf(needle) >= 0) return true;
  if (entry.loginName && entry.loginName.toLowerCase().indexOf(needle) >= 0) return true;
  for (const level of entry.permissionLevels) {
    if (level.toLowerCase().indexOf(needle) >= 0) return true;
  }
  return false;
}

export function usePermissionFilters(
  entries: IPermissionEntry[],
  initialFilter?: PermissionFilter
): IUsePermissionFiltersResult {
  const [filter, setFilter] = React.useState<PermissionFilter>(initialFilter ?? 'all');
  const [searchText, setSearchText] = React.useState<string>('');
  const [externalOnly, setExternalOnly] = React.useState<boolean>(false);
  const [directOnly, setDirectOnly] = React.useState<boolean>(false);
  const [debouncedSearch, setDebouncedSearch] = React.useState<string>('');

  React.useEffect(() => {
    const handle = setTimeout(() => {
      setDebouncedSearch(searchText.trim().toLowerCase());
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [searchText]);

  const filteredEntries = React.useMemo<IPermissionEntry[]>(() => {
    return entries.filter((entry) => {
      if (!passesFilter(entry, filter)) return false;
      if (externalOnly && entry.isExternal !== true) return false;
      if (directOnly && entry.source !== 'Direct') return false;
      if (!matchesSearch(entry, debouncedSearch)) return false;
      return true;
    });
  }, [entries, filter, externalOnly, directOnly, debouncedSearch]);

  return {
    filter,
    setFilter,
    searchText,
    setSearchText,
    externalOnly,
    setExternalOnly,
    directOnly,
    setDirectOnly,
    filteredEntries
  };
}
