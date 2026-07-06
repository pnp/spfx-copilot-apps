import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Text,
  Caption1
} from '@fluentui/react-components';

import type { ILeaveBalance, LeaveType } from '../data/types';
import { remainingDays } from './format';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: tokens.spacingHorizontalM
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow2
  },
  tileHighlight: {
    border: `2px solid ${tokens.colorBrandStroke1}`,
    backgroundColor: tokens.colorBrandBackground2
  },
  remaining: {
    fontSize: tokens.fontSizeHero800,
    lineHeight: tokens.lineHeightHero800,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1
  },
  label: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  breakdown: {
    color: tokens.colorNeutralForeground3
  }
});

export interface IBalanceTilesProps {
  balances: readonly ILeaveBalance[];
  highlight?: LeaveType;
}

export const BalanceTiles: React.FunctionComponent<IBalanceTilesProps> = (
  props
) => {
  const styles = useStyles();
  const { balances, highlight } = props;

  return (
    <div className={styles.grid}>
      {balances.map((b) => {
        const remaining = remainingDays(b);
        const isHighlighted = highlight === b.leaveType;
        return (
          <div
            key={b.leaveType}
            className={mergeClasses(
              styles.tile,
              isHighlighted && styles.tileHighlight
            )}
          >
            <Text className={styles.remaining}>{remaining}</Text>
            <Text className={styles.label}>{b.label} days left</Text>
            <Caption1 className={styles.breakdown}>
              {b.usedDays} of {b.entitledDays} used
              {b.pendingDays > 0 ? ` \u00b7 ${b.pendingDays} pending` : ''}
            </Caption1>
          </div>
        );
      })}
    </div>
  );
};
