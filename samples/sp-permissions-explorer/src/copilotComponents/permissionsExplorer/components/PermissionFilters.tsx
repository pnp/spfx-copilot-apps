import * as React from 'react';
import {
  Caption1,
  Dropdown,
  Input,
  Label,
  Option,
  Switch,
  makeStyles,
  tokens,
  type InputOnChangeData,
  type OptionOnSelectData,
  type SelectionEvents,
  type SwitchOnChangeData
} from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';

import type { PermissionFilter } from '../models/IPermissionsToolInput';

export interface IPermissionFiltersProps {
  filter: PermissionFilter;
  onFilterChange: (value: PermissionFilter) => void;
  searchText: string;
  onSearchChange: (value: string) => void;
  externalOnly: boolean;
  onExternalOnlyChange: (value: boolean) => void;
  directOnly: boolean;
  onDirectOnlyChange: (value: boolean) => void;
  resultCount: number;
  totalCount: number;
}

interface IFilterOption {
  value: PermissionFilter;
  label: string;
}

const FILTER_OPTIONS: IFilterOption[] = [
  { value: 'all', label: 'All' },
  { value: 'users', label: 'Users' },
  { value: 'groups', label: 'Groups' },
  { value: 'externalUsers', label: 'External users' },
  { value: 'fullControl', label: 'Full Control' },
  { value: 'edit', label: 'Edit' },
  { value: 'read', label: 'Read' },
  { value: 'directOnly', label: 'Direct only' }
];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    minWidth: '180px'
  },
  search: {
    minWidth: '220px',
    flexGrow: 1
  },
  caption: {
    marginLeft: 'auto',
    color: tokens.colorNeutralForeground3
  }
});

export const PermissionFilters: React.FC<IPermissionFiltersProps> = (props) => {
  const {
    filter,
    onFilterChange,
    searchText,
    onSearchChange,
    externalOnly,
    onExternalOnlyChange,
    directOnly,
    onDirectOnlyChange,
    resultCount,
    totalCount
  } = props;
  const styles = useStyles();

  const selectedLabel: string =
    FILTER_OPTIONS.find((o) => o.value === filter)?.label ?? 'All';

  const handleSearch = React.useCallback(
    (_ev: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData): void => {
      onSearchChange(data.value);
    },
    [onSearchChange]
  );

  const handleFilterSelect = React.useCallback(
    (_ev: SelectionEvents, data: OptionOnSelectData): void => {
      const next = data.optionValue as PermissionFilter | undefined;
      if (next) onFilterChange(next);
    },
    [onFilterChange]
  );

  const handleExternal = React.useCallback(
    (_ev: React.ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData): void => {
      onExternalOnlyChange(data.checked);
    },
    [onExternalOnlyChange]
  );

  const handleDirect = React.useCallback(
    (_ev: React.ChangeEvent<HTMLInputElement>, data: SwitchOnChangeData): void => {
      onDirectOnlyChange(data.checked);
    },
    [onDirectOnlyChange]
  );

  return (
    <div className={styles.root} role="region" aria-label="Permission filters">
      <div className={`${styles.field} ${styles.search}`}>
        <Label htmlFor="permissions-search">Search</Label>
        <Input
          id="permissions-search"
          value={searchText}
          onChange={handleSearch}
          contentBefore={<SearchRegular aria-hidden="true" />}
          aria-label="Search permissions"
          placeholder="Search by name, email or level"
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="permissions-filter">Filter</Label>
        <Dropdown
          id="permissions-filter"
          value={selectedLabel}
          selectedOptions={[filter]}
          onOptionSelect={handleFilterSelect}
          aria-label="Filter permissions"
        >
          {FILTER_OPTIONS.map((option) => (
            <Option key={option.value} value={option.value} text={option.label}>
              {option.label}
            </Option>
          ))}
        </Dropdown>
      </div>

      <Switch
        checked={externalOnly}
        onChange={handleExternal}
        label="External users only"
      />
      <Switch
        checked={directOnly}
        onChange={handleDirect}
        label="Direct permissions only"
      />

      <Caption1 className={styles.caption} aria-live="polite">
        Showing {resultCount} of {totalCount}
      </Caption1>
    </div>
  );
};

export default PermissionFilters;
