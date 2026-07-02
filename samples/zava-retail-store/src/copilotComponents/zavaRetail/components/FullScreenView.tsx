import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { Settings24Regular, ChevronDown16Regular, MoreHorizontal20Regular, Filter16Regular } from '@fluentui/react-icons';
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
import DashboardFooter from './DashboardFooter';
import type { IFullScreenViewProps } from './IComponentProps';

/**
 * Full-screen executive dashboard composed of the modular sections.
 */
export default function FullScreenView(props: IFullScreenViewProps): React.ReactElement {
  const styles = useZavaStyles();
  const { data } = props;
  const initials = (data.currentUser.displayName ?? 'SM').slice(0, 2).toUpperCase();
  const asOf = data.generatedAt.split(', ').slice(-1)[0];

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
            <div className={styles.topPill}>
              {data.generatedAt.split(',').slice(0, 2).join(',')}
              <ChevronDown16Regular />
            </div>
            <div className={styles.topPill}>
              <Filter16Regular />
              Filters
            </div>
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

        <MetricsRow data={data} />

        <div className={styles.chartRow}>
          <SalesTrendPanel data={data} />
          <SalesByCategory data={data} />
          <SatisfactionPanel data={data} />
        </div>

        <div className={styles.bottomRow}>
          <ProductCarousel
            visibleProducts={props.visibleProducts}
            onPrev={props.onPrevProducts}
            onNext={props.onNextProducts}
          />
          <div className={styles.rightStack}>
            <CustomerFeedback />
            <StoreComparison data={data} />
          </div>
        </div>

        <DashboardFooter asOfLabel={`Data as of ${asOf}`} />
      </div>

      <SettingsDialog
        open={props.isSettingsOpen}
        onOpenChange={props.onSettingsOpenChange}
        useMock={props.useMock}
        dataServiceUrl={props.dataServiceUrl}
        dataError={props.dataError}
        theme={props.theme}
        onUseMockChange={props.onUseMockChange}
        onDataServiceUrlChange={props.onDataServiceUrlChange}
        onThemeChange={props.onThemeChange}
      />
    </div>
  );
}
