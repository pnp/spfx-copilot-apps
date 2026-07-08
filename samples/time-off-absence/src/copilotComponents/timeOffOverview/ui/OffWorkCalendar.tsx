// Multi-month "off work" calendar shown only in the fullscreen Overview layout.
//
// Presentational: it takes the requests + today, asks the pure offWorkCalendar
// logic for a list of month grids, and renders each month as a compact 7-column
// grid of day numbers. Days inside an approved request are painted with the SAME
// green the approved status badge uses (colorPaletteGreenBackground3 +
// colorNeutralForegroundStaticInverted); days inside a pending request use the
// SAME yellow the pending/warning badge uses (colorPaletteYellowBackground3 +
// colorNeutralForeground1Static). Approved wins on overlap (done in the logic), so
// the calendar reads as a glanceable "when am I off / awaiting approval" view.
//
// All styling goes through makeStyles/tokens so it resolves under the iframe
// scoped RendererProvider/FluentProvider like the rest of the component.

import * as React from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Subtitle2,
  Caption1
} from '@fluentui/react-components';

import type { ITimeOffRequest } from '../data/types';
import { buildCalendar } from '../logic/offWorkCalendar';

// Monday-first single-letter weekday headers (matches the Monday-first grid the
// logic builds). Duplicated T/S are intentional and conventional.
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalL
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  legendSwatch: {
    width: '12px',
    height: '12px',
    borderRadius: tokens.borderRadiusSmall,
    flexShrink: 0
  },
  legendSwatchApproved: {
    backgroundColor: tokens.colorPaletteGreenBackground3
  },
  legendSwatchPending: {
    backgroundColor: tokens.colorPaletteYellowBackground3
  },
  legendText: {
    color: tokens.colorNeutralForeground3
  },
  months: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL
  },
  month: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`
  },
  monthTitle: {
    color: tokens.colorNeutralForeground1
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: tokens.spacingHorizontalXXS
  },
  weekday: {
    textAlign: 'center',
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground4
  },
  day: {
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: tokens.fontSizeBase200,
    borderRadius: tokens.borderRadiusSmall,
    color: tokens.colorNeutralForeground1
  },
  dayOff: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: tokens.colorNeutralForegroundStaticInverted,
    fontWeight: tokens.fontWeightSemibold
  },
  dayPending: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
    color: tokens.colorNeutralForeground1Static,
    fontWeight: tokens.fontWeightSemibold
  },
  dayToday: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke1}`,
    fontWeight: tokens.fontWeightSemibold
  }
});

export interface IOffWorkCalendarProps {
  // All requests; the logic keeps the approved (green) and pending (yellow) ones.
  requests: readonly ITimeOffRequest[];
  todayIso: string;
}

export const OffWorkCalendar: React.FunctionComponent<IOffWorkCalendarProps> = (
  props
) => {
  const styles = useStyles();
  const { requests, todayIso } = props;

  const months = React.useMemo(
    () => buildCalendar(requests, todayIso),
    [requests, todayIso]
  );

  return (
    <div className={styles.root}>
      <Subtitle2 className={styles.monthTitle}>Time off calendar</Subtitle2>
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span
            className={mergeClasses(
              styles.legendSwatch,
              styles.legendSwatchApproved
            )}
            aria-hidden="true"
          />
          <Caption1 className={styles.legendText}>Approved</Caption1>
        </span>
        <span className={styles.legendItem}>
          <span
            className={mergeClasses(
              styles.legendSwatch,
              styles.legendSwatchPending
            )}
            aria-hidden="true"
          />
          <Caption1 className={styles.legendText}>Pending</Caption1>
        </span>
      </div>
      <div className={styles.months}>
        {months.map((m) => (
          <div key={`${m.year}-${m.month}`} className={styles.month}>
            <Caption1 className={styles.monthTitle}>{m.label}</Caption1>
            <div className={styles.grid}>
              {WEEKDAYS.map((w, i) => (
                <div key={`wd-${i}`} className={styles.weekday}>
                  {w}
                </div>
              ))}
              {m.weeks.map((week, wi) =>
                week.map((cell, di) =>
                  cell ? (
                    <div
                      key={cell.iso}
                      className={mergeClasses(
                        styles.day,
                        cell.isOff ? styles.dayOff : undefined,
                        cell.isPending ? styles.dayPending : undefined,
                        cell.isToday ? styles.dayToday : undefined
                      )}
                    >
                      {cell.day}
                    </div>
                  ) : (
                    <div key={`e-${wi}-${di}`} className={styles.day} />
                  )
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
