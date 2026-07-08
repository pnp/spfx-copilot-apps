import * as React from 'react';
import { Card, Caption1, Link, Text, makeStyles, tokens } from '@fluentui/react-components';

import type { IRegionRevenue } from '../../models/dashboard';
import { formatCurrencyM } from '../../utils/format';

export interface IRevenueByRegionProps {
  title: string;
  regions: IRegionRevenue[];
  viewDetailsLabel: string;
  onViewDetails: () => void;
}

const BAR_HEIGHT: number = 14;

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
  rows: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '110px 1fr auto',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM
  },
  regionName: {
    color: tokens.colorNeutralForeground2
  },
  track: {
    width: '100%'
  },
  value: {
    fontVariantNumeric: 'tabular-nums',
    color: tokens.colorNeutralForeground2
  }
});

const BAR_COLORS: string[] = [
  tokens.colorBrandBackground,
  tokens.colorPaletteTealBackground2,
  tokens.colorPaletteTealForeground2,
  tokens.colorPalettePurpleBackground2
];

/** Revenue by region, drawn as horizontal SVG bars. */
export default function RevenueByRegion(props: IRevenueByRegionProps): React.ReactElement {
  const { title, regions, viewDetailsLabel, onViewDetails } = props;
  const styles = useStyles();

  const maxRevenue: number = Math.max(...regions.map((r) => r.revenue), 1);

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Text weight="semibold">{title}</Text>
        <Link as="button" appearance="subtle" onClick={onViewDetails}>{viewDetailsLabel}</Link>
      </div>
      <div className={styles.rows}>
        {regions.map((region, index) => {
          const fraction: number = region.revenue / maxRevenue;
          return (
            <div key={region.region} className={styles.row}>
              <Caption1 className={styles.regionName}>{region.region}</Caption1>
              <svg
                className={styles.track}
                height={BAR_HEIGHT}
                viewBox={`0 0 100 ${BAR_HEIGHT}`}
                preserveAspectRatio="none"
                role="img"
                aria-label={`${region.region}: ${formatCurrencyM(region.revenue)}`}
              >
                <rect x={0} y={0} width={100} height={BAR_HEIGHT} rx={3} fill={tokens.colorNeutralBackground5} />
                <rect
                  x={0}
                  y={0}
                  width={Math.max(1, fraction * 100)}
                  height={BAR_HEIGHT}
                  rx={3}
                  fill={BAR_COLORS[index % BAR_COLORS.length]}
                />
              </svg>
              <Caption1 className={styles.value}>{formatCurrencyM(region.revenue)}</Caption1>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
