import * as React from 'react';
import { Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import { CheckmarkCircle16Filled } from '@fluentui/react-icons';

import type { IKpiMetric } from '../../models/dashboard';
import DeltaBadge from '../shared/DeltaBadge';

export interface IInlineKpiProps {
  metric: IKpiMetric;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS
  },
  label: {
    color: tokens.colorNeutralForeground3
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
    color: tokens.colorPaletteGreenForeground1
  }
});

/** Compact headline metric (used as the inline Revenue summary). */
export default function InlineKpi(props: IInlineKpiProps): React.ReactElement {
  const { metric } = props;
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Caption1 className={styles.label}>{metric.label}</Caption1>
      <Text weight="bold" size={600}>{metric.value}</Text>
      <DeltaBadge direction={metric.deltaDirection} value={metric.deltaValue} label={metric.deltaLabel} />
      <Caption1 className={styles.status}>
        <CheckmarkCircle16Filled aria-hidden />
        {metric.status}
      </Caption1>
    </div>
  );
}
