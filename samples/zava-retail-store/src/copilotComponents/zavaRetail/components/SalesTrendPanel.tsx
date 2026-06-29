import * as React from 'react';
import { useZavaStyles } from './useZavaStyles';
import LineChart from './LineChart';
import { palette } from './palette';
import type { IDashboardSectionProps } from './IComponentProps';

/**
 * Sales Trend panel: this-year vs last-year line chart with axis labels.
 */
export default function SalesTrendPanel(props: IDashboardSectionProps): React.ReactElement {
  const styles = useZavaStyles();
  const { salesTrend, dateLabel } = props.data;

  const lastYear = salesTrend.map((value) => Math.round(value * 0.84));
  const peak = Math.max(...salesTrend, 1);
  const top = Math.ceil((peak * 1.6) / 20) * 20;
  const yLabels = [top, (top * 3) / 4, top / 2, top / 4, 0].map((value) => `$${Math.round(value)}k`);

  const start = dateLabel.split(' - ')[0] ?? 'Mon';
  const end = dateLabel.split(' - ')[1] ?? 'Sun';
  const xLabels = [start, '', '', 'Mid', '', '', end];

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div>
          <div className={styles.panelTitle}>Sales Trend</div>
          <div className={styles.panelSub}>{dateLabel}</div>
        </div>
        <div className={styles.topPill}>7D</div>
      </div>

      <div className={styles.legendRow}>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatch} />
          This Year
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendSwatchDashed} />
          Last Year
        </span>
      </div>

      <div className={styles.chartCanvas}>
        <LineChart
          series={[
            { values: salesTrend, color: palette.brandStrong },
            { values: lastYear, color: palette.inkFaint, dashed: true }
          ]}
          xLabels={xLabels}
          yLabels={yLabels}
          highlightLast={`$${salesTrend[salesTrend.length - 1]}k`}
        />
      </div>
    </div>
  );
}
