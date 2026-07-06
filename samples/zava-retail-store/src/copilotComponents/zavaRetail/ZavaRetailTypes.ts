export type ZavaTheme = 'light' | 'dark';

/** Supported retail stores/cities the dashboard can target. */
export type StoreKey = 'seattle' | 'boston' | 'newyork';

/** Individually toggleable sections of the full-screen dashboard. */
export type DashboardSection =
  | 'metrics'
  | 'salesTrend'
  | 'categorySales'
  | 'satisfaction'
  | 'products'
  | 'feedback'
  | 'storeComparison';

/** On/off state for every toggleable dashboard section. */
export type SectionVisibility = Record<DashboardSection, boolean>;

export interface IFeedbackEntry {
  name: string;
  rating: number;
  date: string;
  text: string;
}

export interface IRetailMetric {
  id: string;
  label: string;
  value: string;
  delta: string;
}

export interface IProduct {
  id: string;
  name: string;
  sales: string;
  units: number;
  imageUrl: string;
}

export interface IStoreComparison {
  store: string;
  sales: string;
  targetDelta: string;
  csat: number;
  nps: number;
}

export interface ICurrentUser {
  displayName: string;
  role: string;
  location: string;
  imageUrl?: string;
}

export interface IDashboardData {
  title: string;
  storeKey: StoreKey;
  city: string;
  skylineUrl: string;
  generatedAt: string;
  dateLabel: string;
  metrics: IRetailMetric[];
  salesTrend: number[];
  categorySales: Array<{ category: string; value: number }>;
  sentimentTrend: number[];
  products: IProduct[];
  storeComparisons: IStoreComparison[];
  feedback: IFeedbackEntry[];
  currentUser: ICurrentUser;
}

export interface IZavaRetailDataSettings {
  useMock: boolean;
  dataServiceUrl?: string;
  /** Store/city the dashboard should report on. */
  targetStore: StoreKey;
  /** How many days before today to report on (0 = today, up to 7). */
  dateOffset: number;
}
