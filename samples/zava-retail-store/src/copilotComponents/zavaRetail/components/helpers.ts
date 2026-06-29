import type { IProduct } from '../ZavaRetailTypes';

export function toDisplayModeText(displayMode: string): 'inline' | 'fullscreen' {
  return displayMode?.toLowerCase() === 'fullscreen' ? 'fullscreen' : 'inline';
}

export function getVisibleProducts(products: IProduct[], start: number, count: number): IProduct[] {
  if (!products.length) {
    return [];
  }
  const output: IProduct[] = [];
  for (let index = 0; index < count; index += 1) {
    output.push(products[(start + index) % products.length]);
  }
  return output;
}
