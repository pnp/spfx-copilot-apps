import * as React from 'react';
import { palette } from './palette';

export interface IGaugeProps {
  /** 0..1 portion of the ring to fill. */
  ratio: number;
  color: string;
  label: string;
  caption: string;
  size?: number;
}

/**
 * Circular progress gauge (SVG arc) used for the CSAT score.
 */
export default function Gauge(props: IGaugeProps): React.ReactElement {
  const { ratio, color, label, caption, size = 116 } = props;
  const clamped = Math.max(0, Math.min(1, ratio));
  const radius = (size - 14) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = clamped * circumference;
  const center = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${label} ${caption}`}>
      <circle cx={center} cy={center} r={radius} fill="none" stroke={palette.border} strokeWidth={11} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={11}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference - dash}`}
        transform={`rotate(-90 ${center} ${center})`}
      />
      <text x={center} y={center - 1} textAnchor="middle" fontSize={26} fontWeight={700} fill={palette.inkStrong}>
        {label}
      </text>
      <text x={center} y={center + 16} textAnchor="middle" fontSize={10} fill={palette.inkMuted}>
        {caption}
      </text>
    </svg>
  );
}
