import * as React from 'react';

export interface ISparklineProps {
  values: number[];
  color: string;
  /** Optional fill area under the line. */
  fill?: string;
  height?: number;
  strokeWidth?: number;
}

/**
 * Compact single-series sparkline used inside the metric cards.
 */
export default function Sparkline(props: ISparklineProps): React.ReactElement {
  const { values, color, fill, strokeWidth = 2 } = props;

  if (!values.length) {
    return <svg viewBox="0 0 100 30" preserveAspectRatio="none" />;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const coords = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = 26 - ((value - min) / span) * 20;
    return { x, y };
  });

  const linePoints = coords.map((point) => `${point.x},${point.y}`).join(' ');
  const areaPoints = `0,30 ${linePoints} 100,30`;

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      {fill ? <polygon fill={fill} stroke="none" points={areaPoints} /> : undefined}
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={linePoints}
      />
    </svg>
  );
}
