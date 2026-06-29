import * as React from 'react';
import {
  Body1,
  Card,
  createDOMRenderer,
  Divider,
  FluentProvider,
  RendererProvider,
  Spinner,
  Title2,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components';
import type { CopilotComponentContext } from '@microsoft/sp-copilot-component';

import { loadDashboardData } from './data/ZavaRetailDataService';
import type { IDashboardData, ZavaTheme } from './ZavaRetailTypes';
import {
  DashboardFooter,
  FullScreenView,
  InlineView,
  getVisibleProducts,
  toDisplayModeText,
  useZavaStyles
} from './components';
import { palette, themeColors } from './components/palette';

interface IZavaRetailAppProps {
  context: CopilotComponentContext;
  message: string;
  displayMode: string;
  initialUseMock: boolean;
  initialDataServiceUrl?: string;
  initialTheme: ZavaTheme;
  onRequestFullscreen: () => void;
}

/**
 * Root orchestrator: owns data loading + UI state and delegates rendering to the
 * dedicated components under ./components.
 */
export default function ZavaRetailApp(props: IZavaRetailAppProps): React.ReactElement {
  const styles = useZavaStyles();
  const displayMode = toDisplayModeText(props.displayMode);

  const [useMock, setUseMock] = React.useState<boolean>(props.initialUseMock);
  const [dataServiceUrl, setDataServiceUrl] = React.useState<string>(props.initialDataServiceUrl ?? '');
  const [theme, setTheme] = React.useState<ZavaTheme>(props.initialTheme);
  const [dashboardData, setDashboardData] = React.useState<IDashboardData | undefined>();
  const [dataError, setDataError] = React.useState<string>('');
  const [isDataLoading, setIsDataLoading] = React.useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState<boolean>(false);
  const [productStartIndex, setProductStartIndex] = React.useState<number>(0);

  const fluentTheme = theme === 'dark' ? webDarkTheme : webLightTheme;

  // Fluent v9 styling problem in the SPFx Copilot host: on first mount the Switch / Input /
  // Radio / primary Button render UNSTYLED (square). Diagnostics proved the Griffel CSS
  // rules ARE present in the CSSOM and the design tokens DO resolve — nothing is missing.
  // The controls are square because the Griffel atomic/reset style buckets are inserted in
  // the WRONG relative order amid the host's many stylesheets, so the rounding/background
  // declarations get overridden. Manually switching the theme used to "fix" it because that
  // forces Fluent to do a fresh style-insertion pass once the page has settled.
  //
  // Fix: give this subtree its OWN Griffel renderer (via RendererProvider) and, once after
  // mount — when the host DOM has settled — recreate that renderer (empty cache) and remount
  // the provider subtree via a changing `key`. That makes every Fluent/Griffel rule get
  // (re)inserted in a single correctly-ordered pass, exactly what a manual theme switch did,
  // but automatically and before the settings panel is ever opened.
  const targetDocument = (props.context.domElement?.ownerDocument ?? undefined) as Document | undefined;
  const [rendererGeneration, setRendererGeneration] = React.useState<number>(0);
  const renderer = React.useMemo(() => createDOMRenderer(targetDocument), [targetDocument, rendererGeneration]);
  React.useEffect(() => {
    setRendererGeneration((generation) => generation + 1);
  }, []);

  // Apply the Zava theme tokens (and the root surface/text colors) inline so they
  // reliably win over both Griffel's atomic-class ordering and FluentProvider's own
  // neutral background. Without this, dark mode leaves the panels on their light
  // fallbacks while Fluent paints a neutral-gray background, making the dashboard
  // look blank until it is collapsed back to the inline view.
  const themeStyle = React.useMemo<React.CSSProperties>(() => {
    const vars = theme === 'dark' ? { ...themeColors.light, ...themeColors.dark } : themeColors.light;
    return {
      ...vars,
      backgroundColor: palette.pageBg,
      color: palette.ink
    } as React.CSSProperties;
  }, [theme]);

  React.useEffect(() => {
    let isCancelled = false;

    setIsDataLoading(true);
    setDataError('');

    loadDashboardData(props.context, { useMock, dataServiceUrl })
      .then((result) => {
        if (!isCancelled) {
          setDashboardData(result);
          setProductStartIndex(0);
          setDataError('');
          setIsDataLoading(false);
        }
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          // Keep the last good dashboard (and the settings panel) mounted so the
          // experience stays usable and the user can adjust settings to recover.
          setDataError(error.message);
          setIsDataLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [props.context, useMock, dataServiceUrl]);

  const visibleProducts = React.useMemo(() => {
    if (!dashboardData?.products?.length) {
      return [];
    }
    const visibleCount = displayMode === 'fullscreen' ? 5 : 2;
    return getVisibleProducts(dashboardData.products, productStartIndex, visibleCount);
  }, [dashboardData, displayMode, productStartIndex]);

  const carouselStep = React.useCallback(
    (delta: number): void => {
      if (!dashboardData?.products?.length) {
        return;
      }
      setProductStartIndex((current) => {
        const total = dashboardData.products.length;
        return (current + delta + total) % total;
      });
    },
    [dashboardData]
  );

  const renderBody = (): React.ReactElement => {
    if (!dashboardData) {
      if (isDataLoading) {
        return (
          <div className={styles.loadingContainer}>
            <Spinner label="Loading retail data..." />
          </div>
        );
      }

      return (
        <Card className={styles.errorCard}>
          <Title2>Unable to load data</Title2>
          <Body1>{dataError || 'No dashboard data is available.'}</Body1>
          <Divider />
          <DashboardFooter />
        </Card>
      );
    }

    if (displayMode === 'fullscreen') {
      return (
        <FullScreenView
          data={dashboardData}
          theme={theme}
          useMock={useMock}
          dataServiceUrl={dataServiceUrl}
          dataError={dataError}
          visibleProducts={visibleProducts}
          onPrevProducts={() => carouselStep(-1)}
          onNextProducts={() => carouselStep(1)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isSettingsOpen={isSettingsOpen}
          onSettingsOpenChange={setIsSettingsOpen}
          onUseMockChange={setUseMock}
          onDataServiceUrlChange={setDataServiceUrl}
          onThemeChange={setTheme}
        />
      );
    }

    return <InlineView data={dashboardData} message={props.message} onRequestFullscreen={props.onRequestFullscreen} />;
  };

  return (
    <RendererProvider key={rendererGeneration} renderer={renderer} targetDocument={targetDocument}>
      <FluentProvider
        theme={fluentTheme}
        targetDocument={targetDocument}
        style={themeStyle}
        className={`${styles.root} ${theme === 'dark' ? styles.rootDark : ''}`}
      >
        {renderBody()}
      </FluentProvider>
    </RendererProvider>
  );
}
