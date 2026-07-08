import * as React from 'react';
import { Caption1, makeStyles, tokens } from '@fluentui/react-components';

import type { ITrendPoint } from '../../models/dashboard';

export interface IInlineTrendProps {
  points: ITrendPoint[];
  caption: string;
}

const W: number = 120;
const H: number = 56;

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    rowGap: tokens.spacingVerticalXXS
  },
  caption: {
    color: tokens.colorNeutralForeground3
  },
  svg: {
    width: '100%',
    maxWidth: '140px',
    height: 'auto'
  }
});

/** Revenue-trend sparkline for the inline experience. */
export default function InlineTrend(props: IInlineTrendProps): React.ReactElement {
  const { points, caption } = props;
  const styles = useStyles();

  const actual: number[] = points.map((p) => p.actual).filter((v) => !Number.isNaN(v));
  const target: number[] = points.map((p) => p.target);
  const all: number[] = actual.concat(target);
  const max: number = Math.max(...all, 1);
  const min: number = Math.min(...all, 0);
  const range: number = max - min || 1;

  const toPath = (series: number[]): string =>
    series
      .map((v, i) => {
        const x: number = (i / Math.max(1, series.length - 1)) * W;
        const y: number = H - ((v - min) / range) * H;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

  const actualPath: string = toPath(actual);
  const targetPath: string = toPath(target);

  const lastX: number = W;
  const lastY: number = H - ((actual[actual.length - 1] - min) / range) * H;

  return (
    <div className={styles.root}>
      <Caption1 className={styles.caption}>{caption}</Caption1>
      <svg className={styles.svg} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={caption} preserveAspectRatio="none">
        <path d={targetPath} fill="none" stroke={tokens.colorNeutralForeground3} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} />
        <path d={actualPath} fill="none" stroke={tokens.colorBrandBackground} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={lastX} cy={lastY} r={3} fill={tokens.colorBrandBackground} />
      </svg>
    </div>
  );
}
