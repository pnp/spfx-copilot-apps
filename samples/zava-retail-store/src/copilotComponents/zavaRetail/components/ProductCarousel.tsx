import * as React from 'react';
import { Button } from '@fluentui/react-components';
import { ChevronLeft16Regular, ChevronRight16Regular } from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';
import type { IProductCarouselProps } from './IComponentProps';

/**
 * Top Products carousel with previous/next paging over the product catalog.
 */
export default function ProductCarousel(props: IProductCarouselProps): React.ReactElement {
  const styles = useZavaStyles();
  const [hoveredId, setHoveredId] = React.useState<string | undefined>(undefined);

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Top Products Today</div>
        <span className={styles.linkText}>View all</span>
      </div>

      <div className={styles.productsRow}>
        <Button
          icon={<ChevronLeft16Regular />}
          size="small"
          appearance="subtle"
          onClick={props.onPrev}
          aria-label="Previous products"
        />
        <div className={styles.productsTrack}>
          {props.visibleProducts.map((product) => (
            <div
              key={product.id}
              className={styles.productCard}
              onMouseEnter={() => setHoveredId(product.id)}
              onMouseLeave={() => setHoveredId((current) => (current === product.id ? undefined : current))}
            >
              <div className={styles.productMedia}>
                <img className={styles.productImage} src={product.imageUrl} alt={product.name} />
              </div>
              {hoveredId === product.id && (
                <div className={styles.productZoom}>
                  <img className={styles.productZoomImage} src={product.imageUrl} alt={product.name} />
                  <div className={styles.productZoomCaption}>{product.name}</div>
                </div>
              )}
              <div className={styles.productBody}>
                <div className={styles.productName}>{product.name}</div>
                <div className={styles.productSales}>{product.sales}</div>
                <div className={styles.productUnits}>{product.units} units</div>
              </div>
            </div>
          ))}
        </div>
        <Button
          icon={<ChevronRight16Regular />}
          size="small"
          appearance="subtle"
          onClick={props.onNext}
          aria-label="Next products"
        />
      </div>
    </div>
  );
}
