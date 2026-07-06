import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { Settings24Regular, MoreHorizontal20Regular, Filter16Regular } from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';
import MetricsRow from './MetricsRow';
import SalesTrendPanel from './SalesTrendPanel';
import SalesByCategory from './SalesByCategory';
import SatisfactionPanel from './SatisfactionPanel';
import CustomerFeedback from './CustomerFeedback';
import ProductCarousel from './ProductCarousel';
import StoreComparison from './StoreComparison';
import AppRail from './AppRail';
import SettingsDialog from './SettingsDialog';
import FiltersPanel from './FiltersPanel';
import DashboardFooter from './DashboardFooter';
import type { IFullScreenViewProps } from './IComponentProps';

/**
 * Full-screen executive dashboard composed of the modular sections.
 */
export default function FullScreenView(props: IFullScreenViewProps): React.ReactElement {
  const styles = useZavaStyles();
  const { data, sectionVisibility } = props;
  const initials = (data.currentUser.displayName ?? 'SM').slice(0, 2).toUpperCase();
  const asOf = data.generatedAt.split(', ').slice(-1)[0];

  const showSatisfaction = sectionVisibility.satisfaction;
  const showChartRow = sectionVisibility.salesTrend || sectionVisibility.categorySales || showSatisfaction;
  const showRightStack = sectionVisibility.feedback || sectionVisibility.storeComparison;
  const showBottomRow = sectionVisibility.products || showRightStack;

  return (
    <div className={styles.fullScreenShell}>
      <AppRail onOpenSettings={props.onOpenSettings} />

      <div className={styles.mainColumn}>
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <span className={styles.brandMark} />
            <span className={styles.copilotBrand}>Copilot</span>
            <span className={styles.appTitle}>{data.title}</span>
          </div>

          <div className={styles.topBarRight}>
            <button
              type="button"
              className={`${styles.topPill} ${styles.clickablePill}`}
              onClick={() => props.onFiltersOpenChange(true)}
              aria-label="Open filters"
            >
              <Filter16Regular />
              Filters
            </button>
            <Button icon={<MoreHorizontal20Regular />} appearance="subtle" aria-label="More actions" />
            <div className={styles.avatar}>
              {data.currentUser.imageUrl ? (
                <img className={styles.avatarImage} src={data.currentUser.imageUrl} alt="Current user" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <Button icon={<Settings24Regular />} appearance="subtle" onClick={props.onOpenSettings} aria-label="Open settings" />
          </div>
        </div>

        {sectionVisibility.metrics ? <MetricsRow data={data} /> : undefined}

        {showChartRow ? (
          <div className={styles.chartRow}>
            {sectionVisibility.salesTrend ? <SalesTrendPanel data={data} /> : undefined}
            {sectionVisibility.categorySales ? <SalesByCategory data={data} /> : undefined}
            {showSatisfaction ? <SatisfactionPanel data={data} /> : undefined}
          </div>
        ) : undefined}

        {showBottomRow ? (
          <div className={styles.bottomRow}>
            {sectionVisibility.products ? (
              <ProductCarousel
                visibleProducts={props.visibleProducts}
                onPrev={props.onPrevProducts}
                onNext={props.onNextProducts}
              />
            ) : undefined}
            {showRightStack ? (
              <div className={styles.rightStack}>
                {sectionVisibility.feedback ? <CustomerFeedback data={data} /> : undefined}
                {sectionVisibility.storeComparison ? <StoreComparison data={data} /> : undefined}
              </div>
            ) : undefined}
          </div>
        ) : undefined}

        <DashboardFooter asOfLabel={`Data as of ${asOf}`} />
      </div>

      <FiltersPanel
        open={props.isFiltersOpen}
        onOpenChange={props.onFiltersOpenChange}
        targetStore={props.targetStore}
        onTargetStoreChange={props.onTargetStoreChange}
        dateOffset={props.dateOffset}
        onDateOffsetChange={props.onDateOffsetChange}
        sectionVisibility={props.sectionVisibility}
        onSectionVisibilityChange={props.onSectionVisibilityChange}
      />

      <SettingsDialog
        open={props.isSettingsOpen}
        onOpenChange={props.onSettingsOpenChange}
        useMock={props.useMock}
        dataServiceUrl={props.dataServiceUrl}
        dataError={props.dataError}
        onUseMockChange={props.onUseMockChange}
        onDataServiceUrlChange={props.onDataServiceUrlChange}
      />
    </div>
  );
}
