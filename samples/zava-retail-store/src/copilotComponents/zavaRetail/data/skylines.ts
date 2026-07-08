import type { StoreKey } from '../ZavaRetailTypes';

/**
 * Real skyline photos (Unsplash) for each store city, used as the banner in the inline
 * card. Each URL requests a 1200px-wide, cropped JPEG so it renders sharply in the
 * fixed-height banner.
 */
const UNSPLASH_PARAMS = 'auto=format&fit=crop&w=1200&q=80';

function _unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?${UNSPLASH_PARAMS}`;
}

export const STORE_SKYLINES: Record<StoreKey, string> = {
  // Seattle skyline with the Space Needle and Mount Rainier.
  seattle: _unsplash('photo-1502175353174-a7a70e73b362'),
  // Boston skyline over the harbor at dusk.
  boston: _unsplash('photo-1501979376754-2ff867a4f659'),
  // New York skyline seen from the Brooklyn Bridge.
  newyork: _unsplash('photo-1522083165195-3424ed129620')
};
