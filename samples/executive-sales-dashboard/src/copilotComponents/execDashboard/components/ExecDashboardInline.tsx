import * as React from 'react';
import {
  Button,
  Card,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { ArrowExpand20Regular } from '@fluentui/react-icons';

import type { IDashboardData, IKpiMetric } from '../models/dashboard';
import type { IExecDashboardStrings } from './IExecDashboardProps';

import InlineKpi from './inline/InlineKpi';
import InlineWinRate from './inline/InlineWinRate';
import InlineTrend from './inline/InlineTrend';
import DashboardFooter from './shared/DashboardFooter';

export interface IExecDashboardInlineProps {
  data: IDashboardData;
  strings: IExecDashboardStrings;
  onExpand: () => void;
  onGiveFeedback: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    boxSizing: 'border-box'
  },
  card: {
    padding: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalM
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  }
});

function kpiById(kpis: IKpiMetric[], id: string): IKpiMetric | undefined {
  return kpis.filter((k) => k.id === id)[0];
}

function winRateFraction(kpis: IKpiMetric[]): number {
  const value: string = kpiById(kpis, 'winrate')?.value ?? '0%';
  const parsed: number = parseFloat(value.replace('%', ''));
  return Number.isNaN(parsed) ? 0 : parsed / 100;
}

/**
 * Compact inline experience: a title with an expand affordance, the Revenue
 * headline, a win-rate donut, a trend sparkline, and the shared footer.
 */
export default function ExecDashboardInline(props: IExecDashboardInlineProps): React.ReactElement {
  const { data, strings, onExpand, onGiveFeedback } = props;
  const styles = useStyles();

  const revenue: IKpiMetric | undefined = kpiById(data.kpis, 'revenue');

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <div className={styles.header}>
          <Text weight="semibold">{data.title}</Text>
          <Button
            appearance="subtle"
            icon={<ArrowExpand20Regular />}
            title={strings.ExpandToFullscreenTitle}
            aria-label={strings.ExpandToFullscreenTitle}
            onClick={onExpand}
          />
        </div>
        <div className={styles.body}>
          {revenue ? <InlineKpi metric={revenue} /> : undefined}
          <InlineWinRate winRate={winRateFraction(data.kpis)} caption={strings.WinRateCaption} />
          <InlineTrend points={data.trend} caption={strings.RevenueTrendCaption} />
        </div>
      </Card>

      <DashboardFooter
        disclaimer={strings.FooterDisclaimer}
        poweredBy={strings.FooterPoweredBy}
        giveFeedback={strings.FooterGiveFeedback}
        onGiveFeedback={onGiveFeedback}
      />
    </div>
  );
}
