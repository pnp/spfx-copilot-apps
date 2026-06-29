import * as React from 'react';
import { palette } from './palette';

export interface ILineSeries {
  values: number[];
  color: string;
  dashed?: boolean;
}

export interface ILineChartProps {
  series: ILineSeries[];
  xLabels: string[];
  /** Y axis tick labels rendered top-to-bottom (e.g. ['$80k', '$60k', ...]). */
  yLabels: string[];
  height?: number;
  /** Optional callout marker drawn at the last point of the first series. */
  highlightLast?: string;
}

const VIEW_W = 320;
const VIEW_H = 150;
const PAD_LEFT = 34;
const PAD_RIGHT = 10;
const PAD_TOP = 12;
const PAD_BOTTOM = 22;

function buildPoints(values: number[], min: number, max: number): Array<{ x: number; y: number }> {
  const span = Math.max(1, max - min);
  const innerW = VIEW_W - PAD_LEFT - PAD_RIGHT;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;
  return values.map((value, index) => {
    const x = PAD_LEFT + (index / Math.max(1, values.length - 1)) * innerW;
    const y = PAD_TOP + innerH - ((value - min) / span) * innerH;
    return { x, y };
  });
}

/**
 * Lightweight multi-series line chart (SVG) with gridlines and axis labels,
 * used for the Sales Trend and Sentiment Trend panels.
 */
export default function LineChart(props: ILineChartProps): React.ReactElement {
  const { series, xLabels, yLabels, highlightLast } = props;

  const allValues = series.reduce<number[]>((acc, item) => acc.concat(item.values), []);
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);

  const gridCount = yLabels.length;
  const innerH = VIEW_H - PAD_TOP - PAD_BOTTOM;

  const lastPoint = series.length ? buildPoints(series[0].values, min, max).slice(-1)[0] : undefined;

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} style={{ width: '100%', height: '100%' }} role="img">
      {yLabels.map((label, index) => {
        const y = PAD_TOP + (index / Math.max(1, gridCount - 1)) * innerH;
        return (
          <g key={`grid-${index}`}>
            <line x1={PAD_LEFT} y1={y} x2={VIEW_W - PAD_RIGHT} y2={y} stroke={palette.borderSoft} strokeWidth={1} />
            <text x={PAD_LEFT - 6} y={y + 3} textAnchor="end" fontSize={8} fill={palette.inkFaint}>
              {label}
            </text>
          </g>
        );
      })}

      {series.map((item, seriesIndex) => {
        const points = buildPoints(item.values, min, max);
        const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ');
        return (
          <polyline
            key={`series-${seriesIndex}`}
            fill="none"
            stroke={item.color}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={item.dashed ? '4 4' : undefined}
            points={linePoints}
          />
        );
      })}

      {lastPoint ? <circle cx={lastPoint.x} cy={lastPoint.y} r={3.4} fill={series[0].color} /> : undefined}
      {lastPoint && highlightLast ? (
        <g>
          <rect
            x={Math.min(lastPoint.x - 18, VIEW_W - PAD_RIGHT - 40)}
            y={Math.max(lastPoint.y - 22, 2)}
            width={40}
            height={15}
            rx={4}
            fill={series[0].color}
          />
          <text
            x={Math.min(lastPoint.x + 2, VIEW_W - PAD_RIGHT - 20)}
            y={Math.max(lastPoint.y - 11, 13)}
            textAnchor="middle"
            fontSize={8}
            fontWeight={700}
            fill="#ffffff"
          >
            {highlightLast}
          </text>
        </g>
      ) : undefined}

      {xLabels.map((label, index) => {
        const innerW = VIEW_W - PAD_LEFT - PAD_RIGHT;
        const x = PAD_LEFT + (index / Math.max(1, xLabels.length - 1)) * innerW;
        return (
          <text key={`x-${index}`} x={x} y={VIEW_H - 6} textAnchor="middle" fontSize={8} fill={palette.inkFaint}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}
