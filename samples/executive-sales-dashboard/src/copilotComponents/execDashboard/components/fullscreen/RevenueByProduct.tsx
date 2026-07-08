import * as React from 'react';
import { Card, Caption1, Link, Text, makeStyles, tokens } from '@fluentui/react-components';

import type { IProductRevenue } from '../../models/dashboard';
import { formatCurrencyM, formatPercent } from '../../utils/format';
import { resolveTokenColor } from '../../utils/colors';
import DonutChart, { type IDonutSlice } from '../shared/DonutChart';

export interface IRevenueByProductProps {
  title: string;
  products: IProductRevenue[];
  totalLabel: string;
  totalCaption: string;
  viewDetailsLabel: string;
  onViewDetails: () => void;
}

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalM
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  body: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXL,
    flexWrap: 'wrap'
  },
  legend: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    flexGrow: 1,
    minWidth: '180px'
  },
  legendRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto auto',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS
  },
  swatch: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusSmall
  },
  product: {
    color: tokens.colorNeutralForeground2
  },
  share: {
    color: tokens.colorNeutralForeground3,
    fontVariantNumeric: 'tabular-nums'
  },
  value: {
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground2
  }
});

/** Revenue by product: a donut chart with a value legend. */
export default function RevenueByProduct(props: IRevenueByProductProps): React.ReactElement {
  const { title, products, totalLabel, totalCaption, viewDetailsLabel, onViewDetails } = props;
  const styles = useStyles();

  const slices: IDonutSlice[] = products.map((p) => ({
    value: p.revenue,
    color: resolveTokenColor(p.colorToken)
  }));

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Text weight="semibold">{title}</Text>
        <Link as="button" appearance="subtle" onClick={onViewDetails}>{viewDetailsLabel}</Link>
      </div>
      <div className={styles.body}>
        <DonutChart
          slices={slices}
          size={148}
          thickness={26}
          centerPrimary={totalLabel}
          centerSecondary={totalCaption}
          ariaLabel={title}
        />
        <div className={styles.legend}>
          {products.map((product) => (
            <div key={product.product} className={styles.legendRow}>
              <ProductSwatch color={resolveTokenColor(product.colorToken)} className={styles.swatch} />
              <Caption1 className={styles.product}>{product.product}</Caption1>
              <Caption1 className={styles.share}>{formatPercent(product.share, 0)}</Caption1>
              <Caption1 className={styles.value}>{formatCurrencyM(product.revenue)}</Caption1>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

/** Small colour swatch drawn as SVG so the fill colour is not an inline style. */
function ProductSwatch(props: { color: string; className: string }): React.ReactElement {
  return (
    <svg className={props.className} viewBox="0 0 10 10" aria-hidden>
      <rect x={0} y={0} width={10} height={10} rx={2} fill={props.color} />
    </svg>
  );
}
