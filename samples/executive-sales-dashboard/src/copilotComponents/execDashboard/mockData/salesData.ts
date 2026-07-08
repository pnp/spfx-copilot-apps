/**
 * Deterministic mock data generator for the Executive Sales & Revenue Dashboard.
 *
 * The generator is pure: given a `now` and a set of filters it returns a fully
 * shaped `IDashboardData`. Dates/labels are derived from `now` so the sample is
 * always current. Filters lightly reshape the numbers so the settings panel has
 * a visible effect without a real backend.
 */
import type {
  IDashboardData,
  IForecast,
  IInsight,
  IKpiMetric,
  IProductRevenue,
  IRegionRevenue,
  ITrendPoint
} from '../models/dashboard';
import { formatCount, formatCurrencyM, formatPercent } from '../utils/format';
import { formatDataAsOf, resolveQuarter } from '../utils/datetime';

/** Filters that narrow the dashboard scope. */
export interface IDashboardFilters {
  /** Region key or 'all'. */
  region: string;
  /** Product key or 'all'. */
  product: string;
  /** Customer segment key or 'all'. */
  segment: string;
}

/** Selectable filter option. */
export interface IFilterOption {
  key: string;
  text: string;
}

export const REGION_OPTIONS: IFilterOption[] = [
  { key: 'all', text: 'All Regions' },
  { key: 'na', text: 'North America' },
  { key: 'emea', text: 'EMEA' },
  { key: 'apac', text: 'Asia Pacific' },
  { key: 'latam', text: 'Latin America' }
];

export const PRODUCT_OPTIONS: IFilterOption[] = [
  { key: 'all', text: 'All Products' },
  { key: 'platform', text: 'Contoso Platform' },
  { key: 'analytics', text: 'Contoso Analytics' },
  { key: 'services', text: 'Contoso Services' }
];

export const SEGMENT_OPTIONS: IFilterOption[] = [
  { key: 'all', text: 'All Segments' },
  { key: 'enterprise', text: 'Enterprise' },
  { key: 'commercial', text: 'Commercial' },
  { key: 'smb', text: 'Small & Medium' }
];

const BASE_TOTAL: number = 4_200_000;

interface IRegionDef {
  key: string;
  name: string;
  /** Share of the all-up total (regions sum to 1). */
  share: number;
  /** Region win rate (fraction). */
  winRate: number;
  /** Region gross margin (fraction). */
  margin: number;
  /** Revenue change vs last quarter, in percent (signed). */
  deltaPct: number;
  /** Country breakdown shown when this region is selected (weights sum to 1). */
  countries: Array<{ name: string; weight: number }>;
}

interface IProductDef {
  key: string;
  name: string;
  /** Share of the all-up total (products sum to 1). */
  share: number;
  colorToken: string;
  /** Tier breakdown shown when this product is selected (weights sum to 1). */
  tiers: Array<{ name: string; weight: number }>;
}

interface ISegmentDef {
  key: string;
  name: string;
  /** Share of the all-up total. */
  share: number;
  /** Win-rate adjustment (added to the region win rate). */
  winAdj: number;
  /** Margin adjustment (added to the region margin). */
  marginAdj: number;
}

const REGION_DEFS: IRegionDef[] = [
  {
    key: 'na', name: 'North America', share: 1.8 / 4.2, winRate: 0.44, margin: 0.34, deltaPct: 8,
    countries: [{ name: 'United States', weight: 0.72 }, { name: 'Canada', weight: 0.28 }]
  },
  {
    key: 'emea', name: 'EMEA', share: 1.2 / 4.2, winRate: 0.39, margin: 0.31, deltaPct: 5,
    countries: [{ name: 'United Kingdom', weight: 0.42 }, { name: 'Germany', weight: 0.33 }, { name: 'France', weight: 0.25 }]
  },
  {
    key: 'apac', name: 'Asia Pacific', share: 0.8 / 4.2, winRate: 0.36, margin: 0.30, deltaPct: 12,
    countries: [{ name: 'Japan', weight: 0.44 }, { name: 'Australia', weight: 0.31 }, { name: 'India', weight: 0.25 }]
  },
  {
    key: 'latam', name: 'Latin America', share: 0.4 / 4.2, winRate: 0.33, margin: 0.28, deltaPct: -3,
    countries: [{ name: 'Brazil', weight: 0.55 }, { name: 'Mexico', weight: 0.45 }]
  }
];

const PRODUCT_DEFS: IProductDef[] = [
  {
    key: 'platform', name: 'Contoso Platform', share: 1.76 / 4.2, colorToken: 'colorBrandBackground',
    tiers: [{ name: 'Platform Enterprise', weight: 0.57 }, { name: 'Platform Pro', weight: 0.28 }, { name: 'Platform Team', weight: 0.15 }]
  },
  {
    key: 'analytics', name: 'Contoso Analytics', share: 1.18 / 4.2, colorToken: 'colorPaletteTealBackground2',
    tiers: [{ name: 'Analytics Premium', weight: 0.6 }, { name: 'Analytics Standard', weight: 0.4 }]
  },
  {
    key: 'services', name: 'Contoso Services', share: 0.84 / 4.2, colorToken: 'colorPalettePurpleBackground2',
    tiers: [{ name: 'Consulting', weight: 0.62 }, { name: 'Support', weight: 0.38 }]
  },
  {
    key: 'other', name: 'Other', share: 0.42 / 4.2, colorToken: 'colorNeutralStroke1',
    tiers: [{ name: 'Marketplace', weight: 0.6 }, { name: 'Training', weight: 0.4 }]
  }
];

const SEGMENT_DEFS: Record<string, ISegmentDef> = {
  all: { key: 'all', name: 'All Segments', share: 1, winAdj: 0, marginAdj: 0 },
  enterprise: { key: 'enterprise', name: 'Enterprise', share: 0.55, winAdj: 0.05, marginAdj: 0.03 },
  commercial: { key: 'commercial', name: 'Commercial', share: 0.30, winAdj: 0.0, marginAdj: 0.0 },
  smb: { key: 'smb', name: 'Small & Medium', share: 0.15, winAdj: -0.06, marginAdj: -0.04 }
};

const TIER_COLORS: string[] = [
  'colorBrandBackground',
  'colorPaletteTealBackground2',
  'colorPalettePurpleBackground2'
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Cheap deterministic hash of the filter selection, used to vary the trend. */
function hashFilters(filters: IDashboardFilters): number {
  const source: string = `${filters.region}|${filters.product}|${filters.segment}`;
  let hash: number = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash * 31 + source.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 997;
}

function buildRegions(totalRevenue: number, region: IRegionDef | undefined): IRegionRevenue[] {
  if (region) {
    // Drill into the selected region's countries.
    return region.countries.map((c) => ({
      region: c.name,
      revenue: Math.round(totalRevenue * c.weight)
    }));
  }
  // Distribute the total across all regions by their share (shares sum to 1).
  return REGION_DEFS.map((r) => ({
    region: r.name,
    revenue: Math.round(totalRevenue * r.share)
  }));
}

function buildProducts(totalRevenue: number, product: IProductDef | undefined): IProductRevenue[] {
  if (product) {
    // Drill into the selected product's tiers.
    return product.tiers.map((tier, index) => ({
      product: tier.name,
      revenue: Math.round(totalRevenue * tier.weight),
      share: tier.weight,
      colorToken: TIER_COLORS[index % TIER_COLORS.length]
    }));
  }
  return PRODUCT_DEFS.map((p) => ({
    product: p.name,
    revenue: Math.round(totalRevenue * p.share),
    share: p.share,
    colorToken: p.colorToken
  }));
}

function buildTrend(now: Date, totalRevenue: number, seed: number): ITrendPoint[] {
  const { monthLabels } = resolveQuarter(now);
  const pointsPerMonth: number = 3;
  const totalPoints: number = monthLabels.length * pointsPerMonth;
  const phase: number = ((seed % 100) / 100) * Math.PI * 2;
  const points: ITrendPoint[] = [];

  for (let i = 0; i < totalPoints; i++) {
    const t: number = totalPoints > 1 ? i / (totalPoints - 1) : 0;
    const monthIndex: number = Math.min(monthLabels.length - 1, Math.floor(i / pointsPerMonth));
    const label: string = i % pointsPerMonth === 0 ? monthLabels[monthIndex] : '';

    // Target: a smooth, steadily rising line (drawn dashed).
    const target: number = totalRevenue * (0.30 + 0.62 * t);

    // Actual: smooth, low-frequency undulation that starts just below the
    // target, wanders above and below it, and finishes slightly above — gentle
    // curves like the concept mockup, never a jagged random walk.
    const wave: number =
      0.075 * Math.sin(t * Math.PI * 2 + phase) +
      0.045 * Math.sin(t * Math.PI * 3.3 + phase * 1.7);
    const drift: number = -0.06 + 0.14 * t;
    const actual: number = target * (1 + drift + wave);

    points.push({ label, actual: Math.round(actual), target: Math.round(target) });
  }
  return points;
}

function buildKpis(
  totalRevenue: number,
  revenueDeltaPct: number,
  winRate: number,
  margin: number,
  newCustomers: number
): IKpiMetric[] {
  const revenueUp: boolean = revenueDeltaPct >= 0;
  return [
    {
      id: 'revenue',
      label: 'Revenue (QTD)',
      value: formatCurrencyM(totalRevenue),
      deltaLabel: 'vs last quarter',
      deltaValue: `${Math.abs(revenueDeltaPct)}%`,
      deltaDirection: revenueUp ? 'up' : 'down',
      status: revenueUp ? 'Ahead of plan' : 'Below plan',
      statusTone: revenueUp ? 'positive' : 'warning'
    },
    {
      id: 'margin',
      label: 'Gross Margin',
      value: formatPercent(margin),
      deltaLabel: 'vs last quarter',
      deltaValue: '2.4pp',
      deltaDirection: 'up',
      status: margin >= 0.3 ? 'Above target' : 'Below target',
      statusTone: margin >= 0.3 ? 'positive' : 'warning'
    },
    {
      id: 'winrate',
      label: 'Win Rate',
      value: formatPercent(winRate, 0),
      deltaLabel: 'vs last quarter',
      deltaValue: '5pp',
      deltaDirection: 'up',
      status: winRate >= 0.4 ? 'Above target' : 'On target',
      statusTone: winRate >= 0.4 ? 'positive' : 'neutral'
    },
    {
      id: 'customers',
      label: 'New Customers',
      value: formatCount(newCustomers),
      deltaLabel: 'vs last quarter',
      deltaValue: '16%',
      deltaDirection: 'up',
      status: 'Ahead of plan',
      statusTone: 'positive'
    }
  ];
}

function buildForecast(totalRevenue: number): IForecast {
  const forecast: number = Math.round(totalRevenue * 1.5);
  const target: number = Math.round(forecast / 1.05);
  return {
    forecast,
    target,
    percentOfTarget: forecast / target,
    min: 0,
    max: Math.round(forecast * 1.27)
  };
}

function buildInsights(
  region: IRegionDef | undefined,
  product: IProductDef | undefined,
  segment: ISegmentDef,
  revenueDeltaPct: number,
  winRate: number,
  newCustomers: number
): IInsight[] {
  const regionName: string = region ? region.name : 'North America';
  const productName: string = product ? product.name : 'Contoso Platform';
  const scope: string = segment.key === 'all' ? '' : ` in the ${segment.name} segment`;
  const direction: string = revenueDeltaPct >= 0 ? 'up' : 'down';

  return [
    {
      id: 'i1',
      icon: 'trend',
      text: `Revenue is ${direction} ${Math.abs(revenueDeltaPct)}% vs last quarter, driven by ${regionName}${scope}.`
    },
    {
      id: 'i2',
      icon: 'win',
      text: `Win rate is ${formatPercent(winRate, 0)} this quarter, led by ${productName} wins.`
    },
    {
      id: 'i3',
      icon: 'customers',
      text: `${formatCount(newCustomers)} new customers added${scope}, 16% more than last quarter.`
    }
  ];
}

/** Build the full dashboard payload for `now` and the given filters. */
export function buildMockDashboardData(now: Date, filters: IDashboardFilters): IDashboardData {
  const quarter = resolveQuarter(now);

  const region: IRegionDef | undefined = REGION_DEFS.filter((r) => r.key === filters.region)[0];
  const product: IProductDef | undefined = PRODUCT_DEFS.filter((p) => p.key === filters.product)[0];
  const segment: ISegmentDef = SEGMENT_DEFS[filters.segment] ?? SEGMENT_DEFS.all;

  const regionShare: number = region ? region.share : 1;
  const productShare: number = product ? product.share : 1;
  const totalRevenue: number = Math.round(BASE_TOTAL * regionShare * productShare * segment.share);

  const winRate: number = clamp((region ? region.winRate : 0.41) + segment.winAdj, 0.05, 0.95);
  const margin: number = clamp((region ? region.margin : 0.326) + segment.marginAdj, 0.05, 0.95);
  const revenueDeltaPct: number = region ? region.deltaPct : 8;
  const newCustomers: number = Math.max(6, Math.round(128 * regionShare * productShare * segment.share));

  return {
    title: 'Executive Sales & Revenue Dashboard',
    period: quarter.periodLabel,
    dataAsOf: formatDataAsOf(now),
    kpis: buildKpis(totalRevenue, revenueDeltaPct, winRate, margin, newCustomers),
    trend: buildTrend(now, totalRevenue, hashFilters(filters)),
    regions: buildRegions(totalRevenue, region),
    products: buildProducts(totalRevenue, product),
    totalRevenueLabel: formatCurrencyM(totalRevenue),
    forecast: buildForecast(totalRevenue),
    insights: buildInsights(region, product, segment, revenueDeltaPct, winRate, newCustomers)
  };
}
