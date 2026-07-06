import hoodieImage from '../assets/products/hoodie.png';
import sneakersImage from '../assets/products/sneakers.png';
import backpackImage from '../assets/products/backpack.png';
import jacketImage from '../assets/products/jacket.png';
import watchImage from '../assets/products/watch.png';
import poloImage from '../assets/products/polo-shirt.png';
import shortsImage from '../assets/products/running-shorts.png';
import linenImage from '../assets/products/linen-shirt.png';

import type { CopilotComponentContext } from '@microsoft/sp-copilot-component';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import type {
  IDashboardData,
  IFeedbackEntry,
  IStoreComparison,
  IZavaRetailDataSettings,
  StoreKey
} from '../ZavaRetailTypes';
import { STORE_SKYLINES } from './skylines';

/** Maximum number of days before today the dashboard can report on. */
export const MAX_DATE_OFFSET = 7;

const PRODUCT_CATALOG = [
  { id: '1', name: 'Zava Hoodie', baseSales: 6842, baseUnits: 142, imageUrl: hoodieImage },
  { id: '2', name: 'Premium Sneakers', baseSales: 5980, baseUnits: 96, imageUrl: sneakersImage },
  { id: '3', name: 'Zava Backpack', baseSales: 3418, baseUnits: 78, imageUrl: backpackImage },
  { id: '4', name: 'Denim Jacket', baseSales: 2945, baseUnits: 64, imageUrl: jacketImage },
  { id: '5', name: 'Classic Watch', baseSales: 2310, baseUnits: 38, imageUrl: watchImage },
  { id: '6', name: 'Performance Polo', baseSales: 2052, baseUnits: 72, imageUrl: poloImage },
  { id: '7', name: 'Running Shorts', baseSales: 1824, baseUnits: 86, imageUrl: shortsImage },
  { id: '8', name: 'Linen Shirt', baseSales: 1690, baseUnits: 58, imageUrl: linenImage }
];

interface IStoreSeed {
  key: StoreKey;
  city: string;
  storeName: string;
  location: string;
  managerName: string;
  metrics: { sales: number; transactions: number; basket: number; csat: number; nps: number; conversion: number };
  salesTrend: number[];
  sentimentTrend: number[];
  categorySales: Array<{ category: string; value: number }>;
  productFactor: number;
  /** Product ids in the order they should appear in "Top Products Today". */
  productOrder: string[];
  comparisons: IStoreComparison[];
  feedback: IFeedbackEntry[];
}

const STORE_SEEDS: Record<StoreKey, IStoreSeed> = {
  seattle: {
    key: 'seattle',
    city: 'Seattle',
    storeName: 'Zava Seattle Flagship',
    location: 'Zava Seattle Flagship',
    managerName: 'Olivia Meyer',
    metrics: { sales: 48.2, transactions: 832, basket: 57.96, csat: 4.6, nps: 72, conversion: 28.4 },
    salesTrend: [34, 39, 38, 45, 43, 47, 49],
    sentimentTrend: [35, 58, 61, 53, 59, 66, 72],
    categorySales: [
      { category: 'Apparel', value: 18.6 },
      { category: 'Footwear', value: 9.8 },
      { category: 'Accessories', value: 7.2 },
      { category: 'Home', value: 6.1 },
      { category: 'Beauty', value: 3.7 },
      { category: 'Electronics', value: 2.8 }
    ],
    productFactor: 1,
    productOrder: ['1', '2', '3', '4', '5', '6', '7', '8'],
    comparisons: [
      { store: 'Seattle Flagship', sales: '$48.2k', targetDelta: '+12%', csat: 4.6, nps: 72 },
      { store: 'Bellevue Square', sales: '$36.7k', targetDelta: '+8%', csat: 4.4, nps: 68 },
      { store: 'Portland Pioneer', sales: '$31.2k', targetDelta: '+5%', csat: 4.2, nps: 63 },
      { store: 'Vancouver Centre', sales: '$28.9k', targetDelta: '+2%', csat: 4.1, nps: 59 }
    ],
    feedback: [
      {
        name: 'Olivia M.',
        rating: 5,
        date: '',
        text: 'The staff were incredibly helpful and the store looked beautiful. Found everything I needed.'
      },
      {
        name: 'James T.',
        rating: 4,
        date: '',
        text: 'Good selection and prices. Checkout was quick and easy on a busy afternoon.'
      }
    ]
  },
  boston: {
    key: 'boston',
    city: 'Boston',
    storeName: 'Zava Boston Back Bay',
    location: 'Zava Boston Back Bay',
    managerName: 'Daniel Fitzgerald',
    metrics: { sales: 41.7, transactions: 764, basket: 54.58, csat: 4.5, nps: 68, conversion: 26.1 },
    salesTrend: [30, 33, 37, 35, 40, 42, 44],
    sentimentTrend: [40, 52, 55, 60, 58, 63, 68],
    categorySales: [
      { category: 'Apparel', value: 15.4 },
      { category: 'Footwear', value: 8.9 },
      { category: 'Home', value: 7.3 },
      { category: 'Accessories', value: 6.6 },
      { category: 'Beauty', value: 4.1 },
      { category: 'Electronics', value: 3.2 }
    ],
    productFactor: 0.86,
    productOrder: ['4', '1', '8', '3', '6', '2', '5', '7'],
    comparisons: [
      { store: 'Boston Back Bay', sales: '$41.7k', targetDelta: '+9%', csat: 4.5, nps: 68 },
      { store: 'Cambridge Galleria', sales: '$33.4k', targetDelta: '+6%', csat: 4.3, nps: 64 },
      { store: 'Providence Place', sales: '$27.8k', targetDelta: '+3%', csat: 4.1, nps: 60 },
      { store: 'Quincy Market', sales: '$24.5k', targetDelta: '+1%', csat: 4.0, nps: 57 }
    ],
    feedback: [
      {
        name: 'Sarah C.',
        rating: 5,
        date: '',
        text: 'Loved the fall collection. The team helped me put together a great outfit for work.'
      },
      {
        name: 'Michael O.',
        rating: 4,
        date: '',
        text: 'Store was busy but well organized. Great to see the new Back Bay layout.'
      }
    ]
  },
  newyork: {
    key: 'newyork',
    city: 'New York',
    storeName: 'Zava NYC Fifth Avenue',
    location: 'Zava NYC Fifth Avenue',
    managerName: 'Ava Rossi',
    metrics: { sales: 63.9, transactions: 1128, basket: 56.65, csat: 4.4, nps: 65, conversion: 24.8 },
    salesTrend: [48, 52, 50, 58, 55, 61, 64],
    sentimentTrend: [42, 50, 57, 54, 60, 62, 65],
    categorySales: [
      { category: 'Apparel', value: 24.1 },
      { category: 'Footwear', value: 12.4 },
      { category: 'Accessories', value: 9.8 },
      { category: 'Home', value: 6.9 },
      { category: 'Beauty', value: 5.6 },
      { category: 'Electronics', value: 5.1 }
    ],
    productFactor: 1.32,
    productOrder: ['2', '5', '1', '6', '7', '3', '8', '4'],
    comparisons: [
      { store: 'NYC Fifth Avenue', sales: '$63.9k', targetDelta: '+15%', csat: 4.4, nps: 65 },
      { store: 'Brooklyn Heights', sales: '$47.2k', targetDelta: '+9%', csat: 4.3, nps: 62 },
      { store: 'Queens Center', sales: '$38.6k', targetDelta: '+6%', csat: 4.1, nps: 58 },
      { store: 'Jersey City Newport', sales: '$34.1k', targetDelta: '+3%', csat: 4.0, nps: 55 }
    ],
    feedback: [
      {
        name: 'Emma L.',
        rating: 5,
        date: '',
        text: 'Flagship experience was amazing. The Fifth Avenue store has the best selection in the city.'
      },
      {
        name: 'Noah B.',
        rating: 4,
        date: '',
        text: 'Fast service even with the crowds. Managed to grab the new sneakers before they sold out.'
      }
    ]
  }
};

/** FNV-1a hash used to seed the deterministic per-store/per-day generator. */
function _hash(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic PRNG so a given (store, day) always yields the same numbers. */
function _mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function _clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function _toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read image blob.'));
    reader.readAsDataURL(blob);
  });
}

function _formatDateLabel(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function _shortDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function _dateRangeLabel(endDate: Date): string {
  const start = new Date(endDate);
  start.setDate(endDate.getDate() - 6);
  return `${_shortDate(start)} - ${_shortDate(endDate)}`;
}

async function _resolveGraphUser(context: CopilotComponentContext): Promise<{ displayName: string; imageUrl?: string }> {
  try {
    const client = await context.msGraphClientFactory.getClient('3');
    const me = await client.api('/me').select('displayName').get();
    let imageUrl: string | undefined;

    try {
      const photoResponse = (await client
        .api('/me/photo/$value')
        .responseType(ResponseType.RAW)
        .get()) as Response;
      const photoBlob = await photoResponse.blob();
      imageUrl = await _toDataUrl(photoBlob);
    } catch {
      imageUrl = undefined;
    }

    return {
      displayName: me?.displayName ?? 'Store Manager',
      imageUrl
    };
  } catch {
    return {
      displayName: 'Store Manager'
    };
  }
}

function _buildMockData(
  seed: IStoreSeed,
  reportDate: Date,
  dateOffset: number,
  currentUser: { displayName: string; imageUrl?: string }
): IDashboardData {
  const rng = _mulberry32(_hash(`${seed.key}:${dateOffset}`));
  const dayVariance = 0.88 + rng() * 0.24;

  const sales = seed.metrics.sales * dayVariance;
  const transactions = Math.round(seed.metrics.transactions * dayVariance);
  const basket = seed.metrics.basket * (0.96 + rng() * 0.08);
  const csat = _clamp(seed.metrics.csat + (rng() - 0.5) * 0.3, 3.5, 5);
  const nps = Math.round(_clamp(seed.metrics.nps + (rng() - 0.5) * 8, 40, 90));
  const conversion = _clamp(seed.metrics.conversion + (rng() - 0.5) * 3, 15, 40);

  const salesTrend = seed.salesTrend.map((value) => Math.round(value * (0.9 + rng() * 0.2)));
  const sentimentTrend = seed.sentimentTrend.map((value) => Math.round(_clamp(value * (0.92 + rng() * 0.16), 0, 100)));
  const categorySales = seed.categorySales.map((entry) => ({
    category: entry.category,
    value: Math.round(entry.value * (0.92 + rng() * 0.16) * 10) / 10
  }));

  // Present the catalog in the store's own "Top Products Today" order so each city
  // surfaces a different best-seller ranking.
  const orderedCatalog = seed.productOrder
    .map((id) => PRODUCT_CATALOG.find((product) => product.id === id))
    .filter((product): product is (typeof PRODUCT_CATALOG)[number] => product !== undefined);
  const products = orderedCatalog.map((product) => {
    const factor = seed.productFactor * (0.85 + rng() * 0.3);
    return {
      id: product.id,
      name: product.name,
      sales: `$${Math.round(product.baseSales * factor).toLocaleString('en-US')}`,
      units: Math.round(product.baseUnits * factor),
      imageUrl: product.imageUrl
    };
  });

  const storeComparisons = seed.comparisons.map((row, index) =>
    index === 0 ? { ...row, sales: `$${sales.toFixed(1)}k`, csat: Math.round(csat * 10) / 10, nps } : row
  );

  const feedback = seed.feedback.map((entry) => ({ ...entry, date: _shortDate(reportDate) }));

  return {
    title: `Zava Retail - ${seed.city} Store Performance & Customer Satisfaction`,
    storeKey: seed.key,
    city: seed.city,
    skylineUrl: STORE_SKYLINES[seed.key],
    generatedAt: _formatDateLabel(reportDate),
    dateLabel: _dateRangeLabel(reportDate),
    metrics: [
      { id: 'sales', label: 'Sales vs Target', value: `$${sales.toFixed(1)}k`, delta: `+${(6 + rng() * 9).toFixed(0)}%` },
      { id: 'transactions', label: 'Transactions', value: `${transactions}`, delta: `+${(5 + rng() * 10).toFixed(0)}%` },
      { id: 'basket', label: 'Avg Basket', value: `$${basket.toFixed(2)}`, delta: `+${(2 + rng() * 8).toFixed(1)}%` },
      { id: 'csat', label: 'CSAT', value: `${csat.toFixed(1)} / 5`, delta: `+${(rng() * 0.5).toFixed(1)}` },
      { id: 'nps', label: 'NPS', value: `${nps} / 100`, delta: `+${Math.round(rng() * 9)}` },
      { id: 'conversion', label: 'Conversion Rate', value: `${conversion.toFixed(1)}%`, delta: `+${(1 + rng() * 4).toFixed(1)}pp` }
    ],
    salesTrend,
    categorySales,
    sentimentTrend,
    products,
    storeComparisons,
    feedback,
    currentUser: {
      displayName: currentUser.displayName,
      role: 'Store Lead',
      location: seed.location,
      imageUrl: currentUser.imageUrl
    }
  };
}

export async function loadDashboardData(
  context: CopilotComponentContext,
  settings: IZavaRetailDataSettings
): Promise<IDashboardData> {
  const dateOffset = _clamp(Math.round(settings.dateOffset ?? 0), 0, MAX_DATE_OFFSET);
  const reportDate = new Date();
  reportDate.setDate(reportDate.getDate() - dateOffset);

  const seed = STORE_SEEDS[settings.targetStore] ?? STORE_SEEDS.seattle;

  if (!settings.useMock && !settings.dataServiceUrl) {
    throw new Error('dataServiceUrl is required when useMock is false.');
  }

  if (settings.useMock) {
    return _buildMockData(seed, reportDate, dateOffset, {
      displayName: seed.managerName,
      imageUrl: undefined
    });
  }

  const graphUser = await _resolveGraphUser(context);

  // API integration placeholder: keep the contract ready while returning mocked dashboard payload.
  return _buildMockData(seed, reportDate, dateOffset, graphUser);
}
