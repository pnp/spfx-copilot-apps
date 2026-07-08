import * as React from 'react';
import { Button, Label, Radio, RadioGroup, Switch } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';
import { MAX_DATE_OFFSET } from '../data/ZavaRetailDataService';
import type { DashboardSection, StoreKey } from '../ZavaRetailTypes';
import type { IFiltersPanelProps } from './IComponentProps';

const STORE_OPTIONS: Array<{ key: StoreKey; label: string }> = [
  { key: 'seattle', label: 'Seattle' },
  { key: 'boston', label: 'Boston' },
  { key: 'newyork', label: 'New York' }
];

const SECTION_OPTIONS: Array<{ key: DashboardSection; label: string }> = [
  { key: 'metrics', label: 'Key metrics' },
  { key: 'salesTrend', label: 'Sales trend' },
  { key: 'categorySales', label: 'Sales by category' },
  { key: 'satisfaction', label: 'Customer satisfaction' },
  { key: 'products', label: 'Top products' },
  { key: 'feedback', label: 'Customer feedback' },
  { key: 'storeComparison', label: 'Store comparison' }
];

/** Human-friendly label for a date that is `offset` days before today. */
function dateOptionLabel(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  const dateText = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (offset === 0) {
    return `Today · ${dateText}`;
  }
  if (offset === 1) {
    return `Yesterday · ${dateText}`;
  }
  return dateText;
}

/**
 * Filters panel for the full-screen dashboard. Slides in from the left edge and lets the
 * user retarget the store/city, pick a reporting date within the last week, and toggle
 * which dashboard sections are visible.
 *
 * Uses only inline (non-portaled) Fluent controls (RadioGroup / Switch) because any
 * portaled surface renders unstyled/full-screen-gray in this SPFx Copilot host.
 */
export default function FiltersPanel(props: IFiltersPanelProps): React.ReactElement {
  const styles = useZavaStyles();
  const dateOffsets = React.useMemo(
    () => Array.from({ length: MAX_DATE_OFFSET + 1 }, (_, index) => index),
    []
  );

  return (
    <aside
      className={`${styles.filtersPanel} ${props.open ? styles.filtersPanelOpen : ''}`}
      aria-hidden={!props.open}
      aria-label="Dashboard filters"
    >
      <div className={styles.settingsPanelHeader}>
        <span className={styles.settingsPanelTitle}>Filters</span>
        <Button
          appearance="subtle"
          aria-label="Close filters"
          icon={<Dismiss24Regular />}
          onClick={() => props.onOpenChange(false)}
        />
      </div>

      <div className={styles.settingsPanelBody}>
        <div className={styles.filtersSection}>
          <Label className={styles.filtersSectionLabel}>Store / City</Label>
          <RadioGroup
            value={props.targetStore}
            onChange={(_, data) => props.onTargetStoreChange(data.value as StoreKey)}
          >
            {STORE_OPTIONS.map((option) => (
              <Radio key={option.key} value={option.key} label={option.label} />
            ))}
          </RadioGroup>
        </div>

        <div className={styles.filtersSection}>
          <Label className={styles.filtersSectionLabel}>Reporting date</Label>
          <RadioGroup
            value={String(props.dateOffset)}
            onChange={(_, data) => props.onDateOffsetChange(Number(data.value))}
          >
            {dateOffsets.map((offset) => (
              <Radio key={offset} value={String(offset)} label={dateOptionLabel(offset)} />
            ))}
          </RadioGroup>
        </div>

        <div className={styles.filtersSection}>
          <Label className={styles.filtersSectionLabel}>Visible sections</Label>
          <div className={styles.filtersSwitchList}>
            {SECTION_OPTIONS.map((option) => (
              <Switch
                key={option.key}
                label={option.label}
                checked={props.sectionVisibility[option.key]}
                onChange={(_, data) => props.onSectionVisibilityChange(option.key, Boolean(data.checked))}
              />
            ))}
          </div>
        </div>

        <div className={styles.settingsActions}>
          <Button appearance="primary" onClick={() => props.onOpenChange(false)}>
            Done
          </Button>
        </div>
      </div>
    </aside>
  );
}
