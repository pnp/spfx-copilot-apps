import * as React from 'react';
import { Caption1, Text, makeStyles, tokens } from '@fluentui/react-components';

/** A single donut slice with a resolved CSS colour value. */
export interface IDonutSlice {
  /** Absolute value; slice angle is proportional to this. */
  value: number;
  /** Resolved CSS colour (e.g. a Fluent token value). */
  color: string;
}

export interface IDonutChartProps {
  slices: IDonutSlice[];
  /** Outer diameter in pixels. */
  size: number;
  /** Ring thickness in pixels. */
  thickness: number;
  /** Large centre label (e.g. "$4.2M" or "41%"). */
  centerPrimary?: string;
  /** Small centre caption (e.g. "Total" or "Win rate"). */
  centerSecondary?: string;
  /** Accessible label for the whole chart. */
  ariaLabel: string;
}

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  center: {
    position: 'absolute',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center'
  },
  caption: {
    color: tokens.colorNeutralForeground3
  }
});

/**
 * Reusable, fully offline SVG donut chart. Slices are drawn as dashed circle
 * strokes so no external charting library is needed.
 */
export default function DonutChart(props: IDonutChartProps): React.ReactElement {
  const { slices, size, thickness, centerPrimary, centerSecondary, ariaLabel } = props;
  const styles = useStyles();

  const radius: number = (size - thickness) / 2;
  const circumference: number = 2 * Math.PI * radius;
  const total: number = slices.reduce((sum, s) => sum + s.value, 0) || 1;

  let offset: number = 0;
  const arcs: React.ReactElement[] = slices.map((slice, index) => {
    const fraction: number = slice.value / total;
    const dash: number = fraction * circumference;
    const gap: number = circumference - dash;
    const element: React.ReactElement = (
      <circle
        key={index}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={slice.color}
        strokeWidth={thickness}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
      />
    );
    offset += dash;
    return element;
  });

  return (
    <div className={styles.root}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={ariaLabel}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={tokens.colorNeutralBackground5}
            strokeWidth={thickness}
          />
          {arcs}
        </g>
      </svg>
      {(centerPrimary || centerSecondary) && (
        <div className={styles.center}>
          {centerPrimary ? <Text weight="bold" size={400}>{centerPrimary}</Text> : undefined}
          {centerSecondary ? <Caption1 className={styles.caption}>{centerSecondary}</Caption1> : undefined}
        </div>
      )}
    </div>
  );
}
