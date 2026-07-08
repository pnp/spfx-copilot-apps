import type { ICopilotComponentHostContext, ISPCopilotBridge } from '@microsoft/sp-copilot-component';

import type { ICurrentUser } from '../models/dashboard';

/** Localised UI labels used by the dashboard chrome. */
export interface IExecDashboardStrings {
  GreetingPrefix: string;
  ExpandToFullscreenTitle: string;
  SettingsTitle: string;
  RefreshTitle: string;
  CloseTitle: string;
  FooterDisclaimer: string;
  FooterPoweredBy: string;
  FooterGiveFeedback: string;
  SettingsHeading: string;
  UseMockLabel: string;
  UseMockHint: string;
  DataServiceUrlLabel: string;
  DataServiceUrlPlaceholder: string;
  DataServiceUrlRequired: string;
  RegionLabel: string;
  ProductLabel: string;
  SegmentLabel: string;
  LoadingLabel: string;
  DataAsOfPrefix: string;
  ViewDetails: string;
  BrandName: string;
  RevenueTrendTitle: string;
  RevenueByRegionTitle: string;
  RevenueByProductTitle: string;
  QuarterForecastTitle: string;
  InsightsTitle: string;
  TotalLabel: string;
  OfTargetSuffix: string;
  WinRateCaption: string;
  RevenueTrendCaption: string;
  ActualLabel: string;
  TargetLabel: string;
}

export interface IExecDashboardProps {
  /** Optional greeting/context message passed as a tool argument. */
  message?: string;
  /** Site title fetched from SharePoint REST /_api/web. */
  siteTitle: string;
  /** Absolute URL of the current SharePoint site. */
  siteUrl: string;
  /** Seed value for the `useMock` setting (from component properties). */
  useMock: boolean;
  /** Seed value for the data endpoint used when `useMock` is false. */
  dataServiceUrl: string;
  /** Host context (theme, display mode) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Bridge to communicate with the Copilot host. */
  bridge: ISPCopilotBridge;
  /**
   * Document the FluentProvider should inject its theme styles into. Pass
   * `domElement.ownerDocument` so Griffel writes CSS into the correct iframe
   * document rather than the top-level page.
   */
  targetDocument: Document | undefined;
  /** Localised strings for UI labels. */
  strings: IExecDashboardStrings;
  /**
   * Resolve the current user for the given effective `useMock` flag. When true
   * a mock persona is returned; when false the signed-in user is read from
   * Microsoft Graph. Provided by the SPFx layer so Graph access stays out of
   * the React tree.
   */
  resolveCurrentUser: (useMock: boolean) => Promise<ICurrentUser>;
  /**
   * Request the Copilot host to switch this component to full-screen. Provided
   * by the SPFx layer, which owns the component's `requestDisplayModeAsync`.
   */
  onRequestFullscreen: () => Promise<void>;
}
