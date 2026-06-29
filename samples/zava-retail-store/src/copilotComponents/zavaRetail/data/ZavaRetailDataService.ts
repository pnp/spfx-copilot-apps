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
import type { IDashboardData, IZavaRetailDataSettings } from '../ZavaRetailTypes';

const PRODUCT_CATALOG = [
  { id: '1', name: 'Zava Hoodie', sales: '$6,842', units: 142, imageUrl: hoodieImage },
  { id: '2', name: 'Premium Sneakers', sales: '$5,980', units: 96, imageUrl: sneakersImage },
  { id: '3', name: 'Zava Backpack', sales: '$3,418', units: 78, imageUrl: backpackImage },
  { id: '4', name: 'Denim Jacket', sales: '$2,945', units: 64, imageUrl: jacketImage },
  { id: '5', name: 'Classic Watch', sales: '$2,310', units: 38, imageUrl: watchImage },
  { id: '6', name: 'Performance Polo', sales: '$2,052', units: 72, imageUrl: poloImage },
  { id: '7', name: 'Running Shorts', sales: '$1,824', units: 86, imageUrl: shortsImage },
  { id: '8', name: 'Linen Shirt', sales: '$1,690', units: 58, imageUrl: linenImage }
];

function _toDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Unable to read image blob.'));
    reader.readAsDataURL(blob);
  });
}

function _formatDateLabel(now: Date): string {
  return now.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function _dateRangeLabel(now: Date): string {
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  const startText = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const endText = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${startText} - ${endText}`;
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

function _buildMockData(now: Date, currentUser: { displayName: string; imageUrl?: string }): IDashboardData {
  return {
    title: 'Zava Retail - Store Performance & Customer Satisfaction',
    generatedAt: _formatDateLabel(now),
    dateLabel: _dateRangeLabel(now),
    metrics: [
      { id: 'sales', label: 'Sales vs Target', value: '$48.2k', delta: '+12%' },
      { id: 'transactions', label: 'Transactions', value: '832', delta: '+12%' },
      { id: 'basket', label: 'Avg Basket', value: '$57.96', delta: '+8.7%' },
      { id: 'csat', label: 'CSAT', value: '4.6 / 5', delta: '+0.3' },
      { id: 'nps', label: 'NPS', value: '72 / 100', delta: '+6' },
      { id: 'conversion', label: 'Conversion Rate', value: '28.4%', delta: '+4.3pp' }
    ],
    salesTrend: [34, 39, 38, 45, 43, 47, 49],
    categorySales: [
      { category: 'Apparel', value: 18.6 },
      { category: 'Footwear', value: 9.8 },
      { category: 'Accessories', value: 7.2 },
      { category: 'Home', value: 6.1 },
      { category: 'Beauty', value: 3.7 },
      { category: 'Electronics', value: 2.8 }
    ],
    sentimentTrend: [35, 58, 61, 53, 59, 66, 72],
    products: PRODUCT_CATALOG,
    storeComparisons: [
      { store: 'Seattle Flagship', sales: '$48.2k', targetDelta: '+12%', csat: 4.6, nps: 72 },
      { store: 'Bellevue Square', sales: '$36.7k', targetDelta: '+8%', csat: 4.4, nps: 68 },
      { store: 'Portland Pioneer', sales: '$31.2k', targetDelta: '+5%', csat: 4.2, nps: 63 },
      { store: 'Vancouver Centre', sales: '$28.9k', targetDelta: '+2%', csat: 4.1, nps: 59 }
    ],
    currentUser: {
      displayName: currentUser.displayName,
      role: 'Store Lead',
      location: 'Zava Seattle Flagship',
      imageUrl: currentUser.imageUrl
    }
  };
}

export async function loadDashboardData(
  context: CopilotComponentContext,
  settings: IZavaRetailDataSettings
): Promise<IDashboardData> {
  const now = new Date();

  if (!settings.useMock && !settings.dataServiceUrl) {
    throw new Error('dataServiceUrl is required when useMock is false.');
  }

  if (settings.useMock) {
    return _buildMockData(now, {
      displayName: 'Olivia Meyer',
      imageUrl: undefined
    });
  }

  const graphUser = await _resolveGraphUser(context);

  // API integration placeholder: keep the contract ready while returning mocked dashboard payload.
  return _buildMockData(now, graphUser);
}
