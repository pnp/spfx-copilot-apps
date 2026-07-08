import * as React from 'react';
import {
  Button,
  Caption1,
  Dropdown,
  Option,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import {
  CalendarLtr20Regular,
  ArrowClockwise20Regular
} from '@fluentui/react-icons';

import type { IDashboardFilters, IFilterOption } from '../../mockData/salesData';
import { PRODUCT_OPTIONS, REGION_OPTIONS, SEGMENT_OPTIONS } from '../../mockData/salesData';

export interface IFilterBarProps {
  period: string;
  filters: IDashboardFilters;
  onFiltersChange: (filters: IDashboardFilters) => void;
  regionLabel: string;
  productLabel: string;
  segmentLabel: string;
  dataAsOfPrefix: string;
  dataAsOf: string;
  refreshTitle: string;
  onRefresh: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS
  },
  period: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    borderTopWidth: tokens.strokeWidthThin,
    borderRightWidth: tokens.strokeWidthThin,
    borderBottomWidth: tokens.strokeWidthThin,
    borderLeftWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderRightStyle: 'solid',
    borderBottomStyle: 'solid',
    borderLeftStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke1,
    borderRightColor: tokens.colorNeutralStroke1,
    borderBottomColor: tokens.colorNeutralStroke1,
    borderLeftColor: tokens.colorNeutralStroke1,
    color: tokens.colorNeutralForeground1,
    whiteSpace: 'nowrap'
  },
  dropdown: {
    minWidth: '130px'
  },
  spacer: {
    marginLeft: 'auto'
  },
  asOf: {
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap'
  }
});

function pickText(options: IFilterOption[], key: string): string {
  return options.filter((o) => o.key === key)[0]?.text ?? options[0].text;
}

/** Filter bar: period + region / product / segment selectors and "data as of". */
export default function FilterBar(props: IFilterBarProps): React.ReactElement {
  const {
    period,
    filters,
    onFiltersChange,
    regionLabel,
    productLabel,
    segmentLabel,
    dataAsOfPrefix,
    dataAsOf,
    refreshTitle,
    onRefresh
  } = props;
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <span className={styles.period}>
        <CalendarLtr20Regular aria-hidden />
        {period}
      </span>

      <Dropdown
        className={styles.dropdown}
        aria-label={regionLabel}
        selectedOptions={[filters.region]}
        value={pickText(REGION_OPTIONS, filters.region)}
        onOptionSelect={(_e, data) => onFiltersChange({ ...filters, region: data.optionValue ?? 'all' })}
      >
        {REGION_OPTIONS.map((o) => <Option key={o.key} value={o.key}>{o.text}</Option>)}
      </Dropdown>

      <Dropdown
        className={styles.dropdown}
        aria-label={productLabel}
        selectedOptions={[filters.product]}
        value={pickText(PRODUCT_OPTIONS, filters.product)}
        onOptionSelect={(_e, data) => onFiltersChange({ ...filters, product: data.optionValue ?? 'all' })}
      >
        {PRODUCT_OPTIONS.map((o) => <Option key={o.key} value={o.key}>{o.text}</Option>)}
      </Dropdown>

      <Dropdown
        className={styles.dropdown}
        aria-label={segmentLabel}
        selectedOptions={[filters.segment]}
        value={pickText(SEGMENT_OPTIONS, filters.segment)}
        onOptionSelect={(_e, data) => onFiltersChange({ ...filters, segment: data.optionValue ?? 'all' })}
      >
        {SEGMENT_OPTIONS.map((o) => <Option key={o.key} value={o.key}>{o.text}</Option>)}
      </Dropdown>

      <span className={styles.spacer} />
      <Caption1 className={styles.asOf}>{dataAsOfPrefix} {dataAsOf}</Caption1>
      <Button
        appearance="subtle"
        icon={<ArrowClockwise20Regular />}
        title={refreshTitle}
        aria-label={refreshTitle}
        onClick={onRefresh}
      />
    </div>
  );
}
