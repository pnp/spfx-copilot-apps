import * as React from 'react';
import { useZavaStyles } from './useZavaStyles';
import Gauge from './Gauge';
import LineChart from './LineChart';
import { palette } from './palette';
import type { IDashboardSectionProps } from './IComponentProps';

/**
 * Customer Satisfaction panel: CSAT gauge, NPS score and a sentiment trend line.
 */
export default function SatisfactionPanel(props: IDashboardSectionProps): React.ReactElement {
  const styles = useZavaStyles();
  const { metrics, sentimentTrend } = props.data;

  const csat = metrics.find((metric) => metric.id === 'csat');
  const nps = metrics.find((metric) => metric.id === 'nps');
  const csatValue = Number.parseFloat(csat?.value ?? '4.6');

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Customer Satisfaction</div>
      </div>

      <div className={styles.satisfactionGrid}>
        <Gauge ratio={csatValue / 5} color={palette.brandStrong} label={csatValue.toFixed(1)} caption="CSAT / 5" />
        <div className={styles.npsBlock}>
          <span className={styles.panelSub}>NPS Score</span>
          <span className={styles.npsValue}>{nps?.value.split(' ')[0] ?? '72'}</span>
          <span className={styles.npsDelta}>↑ {nps?.delta ?? '+6'} vs last week</span>
        </div>
      </div>

      <div className={styles.sentimentWrap}>
        <span className={styles.panelSub}>Sentiment Trend (7D)</span>
        <div className={styles.sentimentCanvas}>
          <LineChart
            series={[{ values: sentimentTrend, color: palette.warning }]}
            xLabels={[]}
            yLabels={['100', '50', '0']}
          />
        </div>
      </div>
    </div>
  );
}
