import * as React from 'react';
import { Badge, Card, Text, makeStyles, tokens } from '@fluentui/react-components';

import type { ITrendPoint } from '../../models/dashboard';
import { formatCurrencyM } from '../../utils/format';

export interface IRevenueTrendChartProps {
  title: string;
  points: ITrendPoint[];
  actualLabel: string;
  targetLabel: string;
}

const WIDTH: number = 560;
const HEIGHT: number = 220;
const PAD_LEFT: number = 48;
const PAD_RIGHT: number = 16;
const PAD_TOP: number = 14;
const PAD_BOTTOM: number = 26;
const GRID_STEPS: number = 3;

/** Round a value up to a "nice" number (1, 2, 5 × 10ⁿ) for gridline steps. */
function niceCeil(value: number): number {
  if (value <= 0) {
    return 1;
  }
  const pow: number = Math.pow(10, Math.floor(Math.log10(value)));
  const n: number = value / pow;
  const nice: number = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return nice * pow;
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
  legend: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalM,
    alignItems: 'center'
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3
  },
  swatchActual: {
    width: '14px',
    height: '3px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground
  },
  swatchTarget: {
    width: '14px',
    height: '3px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorNeutralForeground3
  },
  chartWrap: {
    width: '100%',
    overflow: 'hidden'
  },
  svg: {
    width: '100%',
    height: 'auto'
  }
});

interface IScaled {
  x: (index: number, count: number) => number;
  y: (value: number) => number;
}

/** Actual-vs-target revenue trend, drawn as an SVG line chart. */
export default function RevenueTrendChart(props: IRevenueTrendChartProps): React.ReactElement {
  const { title, points, actualLabel, targetLabel } = props;
  const styles = useStyles();

  const values: number[] = [];
  points.forEach((p) => {
    values.push(p.target);
    values.push(Number.isNaN(p.actual) ? p.target : p.actual);
  });
  const rawMax: number = Math.max(...values, 1);
  const step: number = niceCeil(rawMax / GRID_STEPS);
  const chartMax: number = step * GRID_STEPS;

  const scale: IScaled = {
    x: (index: number, count: number) =>
      PAD_LEFT + (index / Math.max(1, count - 1)) * (WIDTH - PAD_LEFT - PAD_RIGHT),
    y: (value: number) =>
      PAD_TOP + (1 - value / chartMax) * (HEIGHT - PAD_TOP - PAD_BOTTOM)
  };

  const count: number = points.length;
  const targetLine: string = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(i, count)} ${scale.y(p.target)}`)
    .join(' ');

  const actualPoints = points.filter((p) => !Number.isNaN(p.actual));
  const actualLine: string = actualPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${scale.x(points.indexOf(p), count)} ${scale.y(p.actual)}`)
    .join(' ');

  const lastActual = actualPoints[actualPoints.length - 1];
  const lastActualIndex: number = lastActual ? points.indexOf(lastActual) : 0;

  const axisLabels = points.filter((p) => p.label);
  const gridValues: number[] = [];
  for (let g = 0; g <= GRID_STEPS; g++) {
    gridValues.push(step * g);
  }

  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <Text weight="semibold">{title}</Text>
        <div className={styles.legend}>
          <span className={styles.legendItem}><span className={styles.swatchActual} />{actualLabel}</span>
          <span className={styles.legendItem}><span className={styles.swatchTarget} />{targetLabel}</span>
        </div>
      </div>
      <div className={styles.chartWrap}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={title}
          preserveAspectRatio="xMidYMid meet"
        >
          {gridValues.map((value, g) => {
            const y: number = scale.y(value);
            return (
              <g key={value}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke={tokens.colorNeutralStroke2}
                  strokeWidth={1}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 3}
                  fontSize={10}
                  textAnchor="end"
                  fill={tokens.colorNeutralForeground3}
                >
                  {g === 0 ? '$0' : formatCurrencyM(value)}
                </text>
              </g>
            );
          })}
          <path
            d={targetLine}
            fill="none"
            stroke={tokens.colorNeutralForeground3}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
          <path
            d={actualLine}
            fill="none"
            stroke={tokens.colorBrandBackground}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {actualPoints.map((p) => (
            <circle
              key={points.indexOf(p)}
              cx={scale.x(points.indexOf(p), count)}
              cy={scale.y(p.actual)}
              r={3}
              fill={tokens.colorBrandBackground}
            />
          ))}
          {lastActual && (
            <circle
              cx={scale.x(lastActualIndex, count)}
              cy={scale.y(lastActual.actual)}
              r={5}
              fill={tokens.colorBrandBackground}
              stroke={tokens.colorNeutralBackground1}
              strokeWidth={2}
            />
          )}
          {axisLabels.map((p) => (
            <text
              key={p.label}
              x={scale.x(points.indexOf(p), count)}
              y={HEIGHT - 8}
              fontSize={11}
              textAnchor="middle"
              fill={tokens.colorNeutralForeground3}
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
      {lastActual && (
        <div className={styles.legend}>
          <Badge appearance="filled" color="brand">{formatCurrencyM(lastActual.actual)} {actualLabel}</Badge>
          <Badge appearance="outline">{formatCurrencyM(lastActual.target)} {targetLabel}</Badge>
        </div>
      )}
    </Card>
  );
}
