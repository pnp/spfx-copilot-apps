import * as React from 'react';
import { useZavaStyles } from './useZavaStyles';
import type { IDashboardSectionProps } from './IComponentProps';

/**
 * Sales by Category horizontal bar panel with a shared value axis.
 */
export default function SalesByCategory(props: IDashboardSectionProps): React.ReactElement {
  const styles = useZavaStyles();
  const { categorySales } = props.data;

  const max = Math.max(...categorySales.map((item) => item.value), 1);
  const axisTop = Math.ceil(max / 5) * 5;

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Sales by Category</div>
      </div>

      {categorySales.map((item) => (
        <div className={styles.categoryRow} key={item.category}>
          <span className={styles.categoryLabel}>{item.category}</span>
          <span className={styles.categoryTrack}>
            <span className={styles.categoryBar} style={{ width: `${Math.max(4, (item.value / axisTop) * 100)}%` }} />
          </span>
          <span className={styles.categoryValue}>${item.value.toFixed(1)}k</span>
        </div>
      ))}

      <div className={styles.categoryAxis}>
        <span>$0</span>
        <span>${Math.round(axisTop / 2)}k</span>
        <span>${axisTop}k</span>
      </div>
    </div>
  );
}
