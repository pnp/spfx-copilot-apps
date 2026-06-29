export type ZavaTheme = 'light' | 'dark';

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
  generatedAt: string;
  dateLabel: string;
  metrics: IRetailMetric[];
  salesTrend: number[];
  categorySales: Array<{ category: string; value: number }>;
  sentimentTrend: number[];
  products: IProduct[];
  storeComparisons: IStoreComparison[];
  currentUser: ICurrentUser;
}

export interface IZavaRetailDataSettings {
  useMock: boolean;
  dataServiceUrl?: string;
}
