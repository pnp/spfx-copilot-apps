import * as React from 'react';
import { Card, Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';

import type { IForecast } from '../../models/dashboard';
import { formatCurrencyM, formatPercent } from '../../utils/format';

export interface IQuarterForecastProps {
  title: string;
  forecast: IForecast;
  ofTargetSuffix: string;
}

const W: number = 240;
const H: number = 150;
const CX: number = W / 2;
const CY: number = 130;
const R: number = 96;
const STROKE: number = 18;

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalS
  },
  gaugeWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  center: {
    marginTop: `-${tokens.spacingVerticalXXL}`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  caption: {
    color: tokens.colorNeutralForeground3
  },
  scale: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    color: tokens.colorNeutralForeground3
  }
});

/** Convert a fraction (0..1) along the 180° gauge to an x/y point. */
function pointOnArc(fraction: number): { x: number; y: number } {
  const angle: number = Math.PI * (1 - fraction);
  return { x: CX + R * Math.cos(angle), y: CY - R * Math.sin(angle) };
}

function arcPath(fromFraction: number, toFraction: number): string {
  const start = pointOnArc(fromFraction);
  const end = pointOnArc(toFraction);
  const largeArc: number = 0;
  return `M ${start.x} ${start.y} A ${R} ${R} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Quarter forecast shown as an SVG gauge. */
export default function QuarterForecast(props: IQuarterForecastProps): React.ReactElement {
  const { title, forecast, ofTargetSuffix } = props;
  const styles = useStyles();

  const range: number = forecast.max - forecast.min || 1;
  const fraction: number = Math.min(1, Math.max(0, (forecast.forecast - forecast.min) / range));

  return (
    <Card className={styles.card}>
      <Text weight="semibold">{title}</Text>
      <div className={styles.gaugeWrap}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
          <path d={arcPath(0, 1)} fill="none" stroke={tokens.colorNeutralBackground5} strokeWidth={STROKE} strokeLinecap="round" />
          <path d={arcPath(0, fraction)} fill="none" stroke={tokens.colorBrandBackground} strokeWidth={STROKE} strokeLinecap="round" />
        </svg>
        <div className={styles.center}>
          <Text weight="bold" size={700}>{formatCurrencyM(forecast.forecast)}</Text>
          <Caption1 className={styles.caption}>{title}</Caption1>
          <Caption1 className={styles.caption}>
            {formatPercent(forecast.percentOfTarget, 0)} {ofTargetSuffix}
          </Caption1>
        </div>
        <div className={styles.scale}>
          <Caption1>{formatCurrencyM(forecast.min)}</Caption1>
          <Caption1>{formatCurrencyM(forecast.max)}</Caption1>
        </div>
      </div>
    </Card>
  );
}
