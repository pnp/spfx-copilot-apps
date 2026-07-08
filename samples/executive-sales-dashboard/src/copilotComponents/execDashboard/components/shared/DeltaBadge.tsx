import * as React from 'react';
import { Caption1, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowUp12Filled, ArrowDown12Filled } from '@fluentui/react-icons';

import type { DeltaDirection } from '../../models/dashboard';

export interface IDeltaBadgeProps {
  direction: DeltaDirection;
  /** Pre-formatted magnitude, e.g. "8%" or "2.4pp". */
  value: string;
  /** Comparison caption, e.g. "vs last quarter". */
  label?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS
  },
  up: { color: tokens.colorPaletteGreenForeground1 },
  down: { color: tokens.colorPaletteRedForeground1 },
  flat: { color: tokens.colorNeutralForeground3 },
  label: { color: tokens.colorNeutralForeground3 }
});

/** Small up/down delta chip with a comparison caption. */
export default function DeltaBadge(props: IDeltaBadgeProps): React.ReactElement {
  const { direction, value, label } = props;
  const styles = useStyles();

  const toneClass: string =
    direction === 'up' ? styles.up : direction === 'down' ? styles.down : styles.flat;

  return (
    <span className={styles.root}>
      <span className={`${styles.root} ${toneClass}`}>
        {direction === 'down' ? <ArrowDown12Filled aria-hidden /> : <ArrowUp12Filled aria-hidden />}
        <Caption1 as="span">{value}</Caption1>
      </span>
      {label ? <Caption1 as="span" className={styles.label}>{label}</Caption1> : undefined}
    </span>
  );
}
