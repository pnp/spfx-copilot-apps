/**
 * View models consumed by the Executive Sales & Revenue Dashboard components.
 *
 * These shapes are the contract between the data layer
 * (`IExecDashboardDataService`) and the React UI. Both the mock and the future
 * real data service project their raw payloads into these models, so the UI
 * never changes when the data source is swapped.
 */

/** Direction of a period-over-period change. */
export type DeltaDirection = 'up' | 'down' | 'flat';

/** Semantic tone used to colour a status pill. */
export type StatusTone = 'positive' | 'neutral' | 'warning';

/** A single headline KPI (Revenue, Gross Margin, Win Rate, New Customers, …). */
export interface IKpiMetric {
  /** Stable identifier used as a React key and to pick an icon. */
  id: string;
  /** Localised metric label, e.g. "Revenue (QTD)". */
  label: string;
  /** Pre-formatted display value, e.g. "$4.2M" or "32.6%". */
  value: string;
  /** Comparison label, e.g. "vs last quarter". */
  deltaLabel: string;
  /** Pre-formatted delta magnitude, e.g. "8%" or "2.4pp". */
  deltaValue: string;
  /** Whether the metric moved up, down or stayed flat. */
  deltaDirection: DeltaDirection;
  /** Short status caption, e.g. "Ahead of plan". */
  status: string;
  /** Tone for the status pill. */
  statusTone: StatusTone;
}

/** One point on the revenue-trend line chart. */
export interface ITrendPoint {
  /** Axis label, e.g. "Apr". */
  label: string;
  /** Actual revenue at this point (absolute value). */
  actual: number;
  /** Target revenue at this point (absolute value). */
  target: number;
}

/** Revenue for a single geography. */
export interface IRegionRevenue {
  /** Region name, e.g. "North America". */
  region: string;
  /** Revenue value (absolute). */
  revenue: number;
}

/** Revenue contribution of a single product. */
export interface IProductRevenue {
  /** Product name, e.g. "Contoso Platform". */
  product: string;
  /** Share of total revenue in the range 0..1. */
  share: number;
  /** Revenue value (absolute). */
  revenue: number;
  /** Fluent colour token name used for the donut slice / legend swatch. */
  colorToken: string;
}

/** Quarter-forecast gauge data. */
export interface IForecast {
  /** Forecast value (absolute). */
  forecast: number;
  /** Target the forecast is measured against (absolute). */
  target: number;
  /** Forecast as a fraction of target (e.g. 1.05 for 105%). */
  percentOfTarget: number;
  /** Lower bound of the gauge scale. */
  min: number;
  /** Upper bound of the gauge scale. */
  max: number;
}

/** A single generated insight. */
export interface IInsight {
  /** Stable identifier used as a React key and to pick an icon. */
  id: string;
  /** Icon key: 'trend' | 'win' | 'customers'. */
  icon: 'trend' | 'win' | 'customers';
  /** Insight sentence. */
  text: string;
}

/** The signed-in (or mock) user rendered in the header. */
export interface ICurrentUser {
  /** Display name. */
  displayName: string;
  /** Two-letter initials fallback for the avatar. */
  initials: string;
  /** Optional avatar image (base64 data URI for mock, Graph blob URL for live). */
  photoUrl?: string;
}

/** The complete dashboard payload returned by a data service. */
export interface IDashboardData {
  /** Dashboard title. */
  title: string;
  /** Reporting period label, e.g. "Q2 2026 (Apr-Jun)". */
  period: string;
  /** "Data as of" label, anchored to the render time. */
  dataAsOf: string;
  /** The four headline KPIs. */
  kpis: IKpiMetric[];
  /** Revenue trend series. */
  trend: ITrendPoint[];
  /** Revenue by region. */
  regions: IRegionRevenue[];
  /** Revenue by product. */
  products: IProductRevenue[];
  /** Pre-formatted total revenue for the product donut centre, e.g. "$4.2M". */
  totalRevenueLabel: string;
  /** Quarter forecast. */
  forecast: IForecast;
  /** Generated insights. */
  insights: IInsight[];
}
