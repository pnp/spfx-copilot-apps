import * as React from 'react';
import { useZavaStyles } from './useZavaStyles';
import type { IDashboardSectionProps } from './IComponentProps';

/**
 * Store / Region comparison table.
 */
export default function StoreComparison(props: IDashboardSectionProps): React.ReactElement {
  const styles = useZavaStyles();

  return (
    <div className={styles.panelCard}>
      <div className={styles.panelHead}>
        <div className={styles.panelTitle}>Store / Region Comparison</div>
        <span className={styles.linkText}>View full report</span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.tableHeadCell}>Store</th>
            <th className={styles.tableHeadCell}>Sales</th>
            <th className={styles.tableHeadCell}>vs Target</th>
            <th className={styles.tableHeadCell}>CSAT</th>
            <th className={styles.tableHeadCell}>NPS</th>
          </tr>
        </thead>
        <tbody>
          {props.data.storeComparisons.map((store) => (
            <tr key={store.store}>
              <td className={styles.tableCell}>{store.store}</td>
              <td className={styles.tableCell}>{store.sales}</td>
              <td className={`${styles.tableCell} ${styles.tableDelta}`}>{store.targetDelta}</td>
              <td className={styles.tableCell}>{store.csat.toFixed(1)}</td>
              <td className={styles.tableCell}>{store.nps}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
