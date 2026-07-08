// Fullscreen team absence calendar (Component C).
//
// A Gantt-style grid: team members down the left, day columns across the top,
// and colored bars spanning each absence. Bars are colored by STATUS exactly
// like the overview off-work calendar — approved = green
// (colorPaletteGreenBackground3 + colorNeutralForegroundStaticInverted),
// pending = yellow (colorPaletteYellowBackground3 + colorNeutralForeground1Static)
// — with the leave type shown as the bar's text label. Overlapping absences on
// one member are packed onto separate lanes so nothing collides.
//
// Presentational only: it asks the pure teamCalendar logic for a fully
// positioned single-month view and maps the result onto a CSS grid. The visible
// month is driven by local state (shiftMonth) with a fixed <  Month YYYY  > +
// Today navigation — no Fluent Dropdown, whose portalled listbox would render
// OUTSIDE the iframe-scoped FluentProvider and come out unstyled in the Copilot
// host.
//
// All styling flows through makeStyles/tokens so it resolves under the
// iframe-scoped RendererProvider/FluentProvider like the rest of the component.

import * as React from 'react';
import { useMemo, useState } from 'react';
import {
  makeStyles,
  mergeClasses,
  tokens,
  Avatar,
  Button,
  Subtitle2,
  Caption1,
  Text
} from '@fluentui/react-components';
import {
  ChevronLeftRegular,
  ChevronRightRegular,
  CalendarTodayRegular
} from '@fluentui/react-icons';

import type { ITeamCalendarRow, ITeamMember } from '../data/types';
import type { LeaveType } from '../../timeOffOverview/data/types';
import { buildTeamCalendarView, shiftMonth } from '../logic/teamCalendar';

// Fixed pixel geometry so the day columns in the header and every member row
// line up perfectly regardless of container width; the whole grid scrolls
// horizontally as one unit when the month is wider than the panel.
const NAME_COL_PX = 200;
const DAY_COL_PX = 40;
const LANE_PX = 24;

const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    minWidth: 0
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalXS
  },
  monthLabel: {
    minWidth: '150px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground1
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
  // Single horizontal scroller; header row + member rows share the same fixed
  // column geometry and scroll together as one wide grid.
  scroll: {
    overflowX: 'auto',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1
  },
  grid: {
    width: 'max-content',
    minWidth: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  headerRow: {
    display: 'flex',
    width: 'max-content',
    position: 'sticky',
    top: 0,
    zIndex: 2,
    backgroundColor: tokens.colorNeutralBackground1,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`
  },
  nameHead: {
    boxSizing: 'border-box',
    width: `${NAME_COL_PX}px`,
    flexShrink: 0,
    position: 'sticky',
    left: 0,
    zIndex: 1,
    padding: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'flex-end'
  },
  nameHeadText: {
    color: tokens.colorNeutralForeground3
  },
  dayHead: {
    display: 'grid'
  },
  dayHeadCell: {
    boxSizing: 'border-box',
    width: `${DAY_COL_PX}px`,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: `${tokens.spacingVerticalXS} 0`
  },
  dayHeadWeekend: {
    backgroundColor: tokens.colorNeutralBackground3
  },
  dayWeekday: {
    fontSize: tokens.fontSizeBase100,
    color: tokens.colorNeutralForeground4,
    textTransform: 'uppercase'
  },
  dayNumber: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    width: '22px',
    height: '22px',
    lineHeight: '22px',
    textAlign: 'center'
  },
  dayNumberToday: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderRadius: tokens.borderRadiusCircular,
    fontWeight: tokens.fontWeightSemibold
  },
  memberRow: {
    display: 'flex',
    width: 'max-content',
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`
  },
  nameCell: {
    boxSizing: 'border-box',
    width: `${NAME_COL_PX}px`,
    flexShrink: 0,
    position: 'sticky',
    left: 0,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground1,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`
  },
  nameText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  nameMain: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  nameSub: {
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  // Bars + day backdrops share one grid; backdrops span every lane (gridRow
  // 1 / -1) to paint continuous weekend/today stripes, bars sit on their lane.
  laneArea: {
    display: 'grid',
    position: 'relative'
  },
  backdrop: {
    gridRow: '1 / -1'
  },
  backdropWeekend: {
    backgroundColor: tokens.colorNeutralBackground3
  },
  backdropToday: {
    backgroundColor: tokens.colorBrandBackground2
  },
  bar: {
    margin: '2px 1px',
    paddingLeft: tokens.spacingHorizontalXS,
    paddingRight: tokens.spacingHorizontalXS,
    borderRadius: tokens.borderRadiusSmall,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: `${LANE_PX - 4}px`,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'default'
  },
  barApproved: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
    color: tokens.colorNeutralForegroundStaticInverted
  },
  barPending: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
    color: tokens.colorNeutralForeground1Static
  },
  // Square off the clipped edge so a bar that continues beyond the visible month
  // reads as "runs off the edge" rather than a self-contained span.
  barClipStart: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    marginLeft: 0
  },
  barClipEnd: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    marginRight: 0
  },
  empty: {
    padding: tokens.spacingHorizontalL,
    color: tokens.colorNeutralForeground3,
    fontStyle: 'italic'
  }
});

function leaveLabel(type: LeaveType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

// Secondary line under a member's name: their job title when known, otherwise a
// friendly relationship label ("You" / "Manager") so every row says something.
function memberSubtitle(member: ITeamMember): string {
  if (member.jobTitle && member.jobTitle.trim()) {
    return member.jobTitle;
  }
  switch (member.relationship) {
    case 'self':
      return 'You';
    case 'manager':
      return 'Manager';
    case 'report':
      return 'Direct report';
    case 'peer':
    default:
      return 'Teammate';
  }
}

export interface ITeamAbsenceCalendarProps {
  rows: readonly ITeamCalendarRow[];
  todayIso: string;
}

export const TeamAbsenceCalendar: React.FunctionComponent<
  ITeamAbsenceCalendarProps
> = (props) => {
  const styles = useStyles();
  const { rows, todayIso } = props;

  // The month containing "today" is the initial view; nav steps from there.
  const initial = useMemo(() => {
    const parts = todayIso.split('-');
    return { year: Number(parts[0]), month: Number(parts[1]) - 1 };
  }, [todayIso]);

  const [view, setView] = useState<{ year: number; month: number }>(initial);

  const calView = useMemo(
    () => buildTeamCalendarView(rows, view.year, view.month, todayIso),
    [rows, view.year, view.month, todayIso]
  );

  const dayTemplate = `repeat(${calView.daysInMonth}, ${DAY_COL_PX}px)`;

  const go = (delta: number): void => {
    setView((v) => shiftMonth(v.year, v.month, delta));
  };
  const goToday = (): void => {
    setView(initial);
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.nav}>
          <Button
            appearance="subtle"
            icon={<ChevronLeftRegular />}
            onClick={() => go(-1)}
            aria-label="Previous month"
          />
          <Subtitle2 className={styles.monthLabel}>
            {calView.monthLabel}
          </Subtitle2>
          <Button
            appearance="subtle"
            icon={<ChevronRightRegular />}
            onClick={() => go(1)}
            aria-label="Next month"
          />
          <Button
            appearance="subtle"
            icon={<CalendarTodayRegular />}
            onClick={goToday}
          >
            Today
          </Button>
        </div>
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
          <Caption1 className={styles.legendText}>
            Bars are labelled by leave type.
          </Caption1>
        </div>
      </div>

      <div className={styles.scroll}>
        <div className={styles.grid}>
          <div className={styles.headerRow}>
            <div className={styles.nameHead}>
              <Caption1 className={styles.nameHeadText}>Team member</Caption1>
            </div>
            <div className={styles.dayHead} style={{ gridTemplateColumns: dayTemplate }}>
              {calView.days.map((d) => (
                <div
                  key={d.iso}
                  className={mergeClasses(
                    styles.dayHeadCell,
                    d.isWeekend ? styles.dayHeadWeekend : undefined
                  )}
                >
                  <span className={styles.dayWeekday}>
                    {WEEKDAY_LETTERS[d.weekday]}
                  </span>
                  <span
                    className={mergeClasses(
                      styles.dayNumber,
                      d.isToday ? styles.dayNumberToday : undefined
                    )}
                  >
                    {d.day}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {calView.rows.length === 0 ? (
            <Caption1 className={styles.empty}>
              No team members to show.
            </Caption1>
          ) : (
            calView.rows.map((row) => (
              <div key={row.member.email} className={styles.memberRow}>
                <div className={styles.nameCell}>
                  <Avatar
                    name={row.member.displayName}
                    image={
                      row.member.photoUrl
                        ? { src: row.member.photoUrl }
                        : undefined
                    }
                    color="colorful"
                    size={28}
                  />
                  <div className={styles.nameText}>
                    <Text className={styles.nameMain}>
                      {row.member.displayName}
                    </Text>
                    <Caption1 className={styles.nameSub}>
                      {memberSubtitle(row.member)}
                    </Caption1>
                  </div>
                </div>
                <div
                  className={styles.laneArea}
                  style={{
                    gridTemplateColumns: dayTemplate,
                    gridTemplateRows: `repeat(${row.laneCount}, ${LANE_PX}px)`
                  }}
                >
                  {calView.days.map((d, di) => (
                    <div
                      key={`bg-${d.iso}`}
                      aria-hidden="true"
                      className={mergeClasses(
                        styles.backdrop,
                        d.isWeekend ? styles.backdropWeekend : undefined,
                        d.isToday ? styles.backdropToday : undefined
                      )}
                      style={{ gridColumn: `${di + 1} / ${di + 2}` }}
                    />
                  ))}
                  {row.lanes.map((lane, li) =>
                    lane.map((pb) => (
                      <div
                        key={pb.bar.requestId}
                        title={`${row.member.displayName} \u00b7 ${leaveLabel(
                          pb.bar.leaveType
                        )}`}
                        className={mergeClasses(
                          styles.bar,
                          pb.bar.status === 'approved'
                            ? styles.barApproved
                            : styles.barPending,
                          pb.clippedStart ? styles.barClipStart : undefined,
                          pb.clippedEnd ? styles.barClipEnd : undefined
                        )}
                        style={{
                          gridColumn: `${pb.startCol} / ${pb.endCol + 1}`,
                          gridRow: `${li + 1} / ${li + 2}`
                        }}
                      >
                        {leaveLabel(pb.bar.leaveType)}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
