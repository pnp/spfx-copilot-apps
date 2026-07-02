import * as React from 'react';
import {
  Money24Filled,
  Cart24Regular,
  ShoppingBag24Regular,
  ShieldCheckmark24Regular,
  Heart24Regular,
  Target24Regular
} from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';
import Sparkline from './Sparkline';
import { metricAccent, palette } from './palette';
import type { IDashboardSectionProps } from './IComponentProps';

const METRIC_ICONS: Record<string, React.ReactElement> = {
  sales: <Money24Filled />,
  transactions: <Cart24Regular />,
  basket: <ShoppingBag24Regular />,
  csat: <ShieldCheckmark24Regular />,
  nps: <Heart24Regular />,
  conversion: <Target24Regular />
};

/** Phase-shifted sparkline series so each card looks distinct yet stable. */
function sparkSeries(base: number[], offset: number): number[] {
  return base.map((value, index) => value + Math.sin((index + offset) * 0.9) * 3);
}

/**
 * Top KPI strip of six metric cards, each with an accent icon, delta pill and sparkline.
 */
export default function MetricsRow(props: IDashboardSectionProps): React.ReactElement {
  const styles = useZavaStyles();

  return (
    <div className={styles.metricGrid}>
      {props.data.metrics.map((metric, index) => {
        const accent = metricAccent[metric.id] ?? { fg: palette.brandStrong, bg: palette.brandSofter };
        return (
          <div key={metric.id} className={styles.metricCard}>
            <div className={styles.metricHead}>
              <span className={styles.metricIcon} style={{ backgroundColor: accent.bg, color: accent.fg }}>
                {METRIC_ICONS[metric.id] ?? <Target24Regular />}
              </span>
              <span className={styles.metricDelta}>↑ {metric.delta}</span>
            </div>
            <span className={styles.metricLabel}>{metric.label}</span>
            <span className={styles.metricValue}>{metric.value}</span>
            <div className={styles.metricSpark}>
              <Sparkline values={sparkSeries(props.data.salesTrend, index)} color={accent.fg} strokeWidth={2} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
