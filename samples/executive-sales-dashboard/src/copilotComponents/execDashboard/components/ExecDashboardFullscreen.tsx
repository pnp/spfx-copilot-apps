import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

import type { ICurrentUser, IDashboardData } from '../models/dashboard';
import type { IDashboardFilters } from '../mockData/salesData';
import type { IExecDashboardSettings } from '../utils/settings';
import type { IExecDashboardStrings } from './IExecDashboardProps';

import DashboardHeader from './fullscreen/DashboardHeader';
import FilterBar from './fullscreen/FilterBar';
import KpiRow from './fullscreen/KpiRow';
import RevenueTrendChart from './fullscreen/RevenueTrendChart';
import RevenueByRegion from './fullscreen/RevenueByRegion';
import RevenueByProduct from './fullscreen/RevenueByProduct';
import QuarterForecast from './fullscreen/QuarterForecast';
import InsightsPanel from './fullscreen/InsightsPanel';
import SettingsPanel from './fullscreen/SettingsPanel';
import DashboardFooter from './shared/DashboardFooter';

export interface IExecDashboardFullscreenProps {
  data: IDashboardData;
  currentUser: ICurrentUser | undefined;
  settings: IExecDashboardSettings;
  strings: IExecDashboardStrings;
  onSettingsChange: (settings: IExecDashboardSettings) => void;
  onRefresh: () => void;
  onGiveFeedback: () => void;
  onViewDetails: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100%',
    boxSizing: 'border-box',
    backgroundColor: tokens.colorNeutralBackground2
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    padding: tokens.spacingHorizontalL,
    flexGrow: 1
  },
  primaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: tokens.spacingHorizontalM,
    alignItems: 'stretch'
  },
  secondaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: tokens.spacingHorizontalM,
    alignItems: 'stretch'
  }
});

/**
 * Full-screen dashboard shell. Composes the header, filter bar, KPI row and the
 * chart panels into a responsive grid, plus the settings drawer and footer.
 */
export default function ExecDashboardFullscreen(props: IExecDashboardFullscreenProps): React.ReactElement {
  const { data, currentUser, settings, strings, onSettingsChange, onRefresh, onGiveFeedback, onViewDetails } = props;
  const styles = useStyles();

  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);

  const handleFiltersChange = React.useCallback((filters: IDashboardFilters): void => {
    onSettingsChange({ ...settings, filters });
  }, [onSettingsChange, settings]);

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <DashboardHeader
          title={data.title}
          brandName={strings.BrandName}
          currentUser={currentUser}
          settingsTitle={strings.SettingsTitle}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        <FilterBar
          period={data.period}
          filters={settings.filters}
          onFiltersChange={handleFiltersChange}
          regionLabel={strings.RegionLabel}
          productLabel={strings.ProductLabel}
          segmentLabel={strings.SegmentLabel}
          dataAsOfPrefix={strings.DataAsOfPrefix}
          dataAsOf={data.dataAsOf}
          refreshTitle={strings.RefreshTitle}
          onRefresh={onRefresh}
        />

        <KpiRow kpis={data.kpis} />

        <div className={styles.primaryGrid}>
          <RevenueTrendChart
            title={`${strings.RevenueTrendTitle} (${data.period.split(' (')[0]})`}
            points={data.trend}
            actualLabel={strings.ActualLabel}
            targetLabel={strings.TargetLabel}
          />
          <RevenueByRegion
            title={strings.RevenueByRegionTitle}
            regions={data.regions}
            viewDetailsLabel={strings.ViewDetails}
            onViewDetails={onViewDetails}
          />
        </div>

        <div className={styles.secondaryGrid}>
          <RevenueByProduct
            title={strings.RevenueByProductTitle}
            products={data.products}
            totalLabel={data.totalRevenueLabel}
            totalCaption={strings.TotalLabel}
            viewDetailsLabel={strings.ViewDetails}
            onViewDetails={onViewDetails}
          />
          <QuarterForecast title={strings.QuarterForecastTitle} forecast={data.forecast} ofTargetSuffix={strings.OfTargetSuffix} />
          <InsightsPanel title={strings.InsightsTitle} insights={data.insights} />
        </div>
      </div>

      <DashboardFooter
        disclaimer={strings.FooterDisclaimer}
        poweredBy={strings.FooterPoweredBy}
        giveFeedback={strings.FooterGiveFeedback}
        onGiveFeedback={onGiveFeedback}
      />

      <SettingsPanel
        open={isSettingsOpen}
        settings={settings}
        strings={strings}
        onSettingsChange={onSettingsChange}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
