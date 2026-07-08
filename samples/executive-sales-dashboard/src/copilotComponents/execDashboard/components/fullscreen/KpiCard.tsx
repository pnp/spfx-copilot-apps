import * as React from 'react';
import { Card, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';
import { CheckmarkCircle16Filled } from '@fluentui/react-icons';

import type { IKpiMetric } from '../../models/dashboard';
import DeltaBadge from '../shared/DeltaBadge';

export interface IKpiCardProps {
  metric: IKpiMetric;
  /** Leading icon for the metric. */
  icon: React.ReactElement;
}

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalS
  },
  top: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorBrandForeground1,
    flexShrink: 0
  },
  metricText: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    color: tokens.colorNeutralForeground2
  },
  status: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS
  },
  positive: { color: tokens.colorPaletteGreenForeground1 },
  neutral: { color: tokens.colorNeutralForeground3 },
  warning: { color: tokens.colorPaletteDarkOrangeForeground1 }
});

/** A single headline KPI card (icon, value, delta, status). */
export default function KpiCard(props: IKpiCardProps): React.ReactElement {
  const { metric, icon } = props;
  const styles = useStyles();

  const toneClass: string =
    metric.statusTone === 'positive'
      ? styles.positive
      : metric.statusTone === 'warning'
        ? styles.warning
        : styles.neutral;

  return (
    <Card className={styles.card}>
      <div className={styles.top}>
        <span className={styles.iconWrap} aria-hidden>{icon}</span>
        <div className={styles.metricText}>
          <Caption1 className={styles.label}>{metric.label}</Caption1>
          <Text weight="bold" size={700}>{metric.value}</Text>
        </div>
      </div>
      <DeltaBadge direction={metric.deltaDirection} value={metric.deltaValue} label={metric.deltaLabel} />
      <Caption1 className={`${styles.status} ${toneClass}`}>
        <CheckmarkCircle16Filled aria-hidden />
        {metric.status}
      </Caption1>
    </Card>
  );
}
