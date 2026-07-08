import * as React from 'react';
import { tokens } from '@fluentui/react-components';

import DonutChart, { type IDonutSlice } from '../shared/DonutChart';

export interface IInlineWinRateProps {
  /** Win rate as a fraction (0..1). */
  winRate: number;
  caption: string;
}

/** Small win-rate donut for the inline experience. */
export default function InlineWinRate(props: IInlineWinRateProps): React.ReactElement {
  const { winRate, caption } = props;

  const slices: IDonutSlice[] = [
    { value: winRate, color: tokens.colorBrandBackground },
    { value: Math.max(0, 1 - winRate), color: tokens.colorNeutralBackground5 }
  ];

  return (
    <DonutChart
      slices={slices}
      size={96}
      thickness={14}
      centerPrimary={`${Math.round(winRate * 100)}%`}
      centerSecondary={caption}
      ariaLabel={`${caption}: ${Math.round(winRate * 100)}%`}
    />
  );
}
