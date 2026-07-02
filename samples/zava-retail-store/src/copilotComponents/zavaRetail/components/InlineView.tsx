import * as React from 'react';
import { Button } from '@fluentui/react-components';
import {
  Dismiss16Regular,
  MoreHorizontal20Regular,
  Open16Regular,
  Mic16Regular,
  Send16Regular,
  ThumbLike16Regular,
  ThumbDislike16Regular,
  Money16Filled,
  Star16Filled,
  Building16Regular
} from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';
import Sparkline from './Sparkline';
import { metricAccent, palette } from './palette';
import type { IInlineViewProps } from './IComponentProps';

const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Left-hand Copilot inline card summarizing the store's day.
 */
export default function InlineView(props: IInlineViewProps): React.ReactElement {
  const styles = useZavaStyles();
  const { data, message, onRequestFullscreen } = props;

  const salesMetric = data.metrics.find((metric) => metric.id === 'sales');
  const csatMetric = data.metrics.find((metric) => metric.id === 'csat');
  const topCategory = data.categorySales[0];

  return (
    <div className={styles.inlineFrame}>
      <div className={styles.inlineHeader}>
        <div className={styles.copilotBrand}>
          <span className={styles.brandMark} />
          <span>Copilot</span>
        </div>
        <div className={styles.inlineHeaderActions}>
          <Button icon={<MoreHorizontal20Regular />} size="small" appearance="subtle" aria-label="More" />
          <Button icon={<Dismiss16Regular />} size="small" appearance="subtle" aria-label="Close" />
        </div>
      </div>

      <div className={styles.promptBubble}>{message || "Show me today's store performance for Seattle."}</div>
      <span className={styles.summaryLabel}>Here&apos;s the summary for today.</span>

      <div className={styles.inlineStoreCard}>
        <img
          className={styles.skyline}
          src="https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1200&q=80"
          alt="Seattle skyline"
        />
        <div className={styles.skylineBadge}>
          <Building16Regular />
        </div>
        <div className={styles.inlineStoreMeta}>
          <span className={styles.inlineStoreName}>{data.currentUser.location}</span>
          <span className={styles.inlineStoreSub}>{data.generatedAt}</span>
        </div>
      </div>

      <div className={styles.inlineKpiCard}>
        <span className={styles.inlineKpiIcon} style={{ backgroundColor: metricAccent.sales.bg, color: metricAccent.sales.fg }}>
          <Money16Filled />
        </span>
        <span>
          <span className={styles.kpiLabel}>Today&apos;s Sales</span>
          <div className={styles.kpiValue}>{salesMetric?.value ?? '$48.2k'}</div>
          <span className={styles.kpiSubline}>↑ {salesMetric?.delta ?? '+12%'} vs target</span>
        </span>
      </div>

      <div className={styles.inlineKpiCard}>
        <span className={styles.inlineKpiIcon} style={{ backgroundColor: metricAccent.csat.bg, color: metricAccent.csat.fg }}>
          <Star16Filled />
        </span>
        <span>
          <span className={styles.kpiLabel}>Customer Satisfaction</span>
          <div className={styles.kpiValue}>{csatMetric?.value.split(' ')[0] ?? '4.6'}</div>
          <span className={styles.kpiSubline}>↑ {csatMetric?.delta ?? '+0.3'} vs yesterday</span>
        </span>
      </div>

      <div className={styles.inlineMiniTrend}>
        <span className={styles.kpiLabel}>Sales trend (this week)</span>
        <div className={styles.miniChart}>
          <Sparkline values={data.salesTrend} color={palette.brandStrong} fill="rgba(79,70,229,0.12)" />
        </div>
        <div className={styles.miniAxis}>
          {WEEK_LABELS.map((label, index) => (
            <span key={`week-${index}`}>{label}</span>
          ))}
        </div>
      </div>

      {topCategory ? (
        <div className={styles.inlineKpiCard}>
          <span
            className={styles.inlineKpiIcon}
            style={{ backgroundColor: metricAccent.basket.bg, color: metricAccent.basket.fg }}
          >
            #
          </span>
          <span>
            <span className={styles.kpiLabel}>Top Category</span>
            <div className={styles.kpiValue} style={{ fontSize: '18px' }}>
              {topCategory.category}
            </div>
            <span className={styles.inlineStoreSub}>${topCategory.value.toFixed(1)}k in sales</span>
          </span>
        </div>
      ) : undefined}

      <Button
        appearance="outline"
        className={styles.inlineActionButton}
        icon={<Open16Regular />}
        iconPosition="after"
        onClick={onRequestFullscreen}
      >
        Open full dashboard
      </Button>

      <div className={styles.inlinePromptRow}>
        <span>Ask a follow-up...</span>
        <span className={styles.inlinePromptIcons}>
          <Mic16Regular />
          <Send16Regular />
        </span>
      </div>

      <div className={styles.inlineFooter}>
        <span>AI-generated content may be incorrect</span>
        <span className={styles.inlineFooterThumbs}>
          <ThumbLike16Regular />
          <ThumbDislike16Regular />
        </span>
      </div>
    </div>
  );
}
