import * as React from 'react';

import { Badge, makeStyles, shorthands, tokens, Text } from '@fluentui/react-components';
import { Location16Regular, Video16Regular } from '@fluentui/react-icons';

import type { IMeeting } from '../../models/myDay';
import { formatTimeRange, formatTimeUntil } from '../../utils/datetime';
import InlineDetailHeader from './InlineDetailHeader';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  row: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '10px 12px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color, border-color, box-shadow',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow8
    }
  },
  rail: {
    flexShrink: 0,
    width: '4px',
    borderRadius: tokens.borderRadiusSmall,
    backgroundColor: tokens.colorBrandBackground
  },
  railHigh: {
    backgroundColor: tokens.colorPaletteRedBackground3
  },
  body: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  subject: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: tokens.colorNeutralForeground3,
    flexWrap: 'wrap'
  },
  metaItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px'
  },
  trailing: {
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: '2px'
  },
  until: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    whiteSpace: 'nowrap'
  },
  empty: {
    padding: '16px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  }
});

export interface IMeetingsListProps {
  meetings: IMeeting[];
  now: Date;
  onBack: () => void;
}

/** Drill-down: today's upcoming meetings (next five still in the future). */
const MeetingsList: React.FunctionComponent<IMeetingsListProps> = (props) => {
  const styles = useStyles();
  const { meetings, now, onBack } = props;

  const upcoming = meetings.filter((m) => m.end.getTime() > now.getTime()).slice(0, 5);

  return (
    <div className={styles.root}>
      <InlineDetailHeader title="Meetings" onBack={onBack} />
      {upcoming.length === 0 ? (
        <Text className={styles.empty}>No more meetings today.</Text>
      ) : (
        <div className={styles.list}>
          {upcoming.map((m) => (
            <div key={m.id} className={styles.row}>
              <span
                className={
                  m.importance === 'high' ? `${styles.rail} ${styles.railHigh}` : styles.rail
                }
              />
              <div className={styles.body}>
                <Text size={300} className={styles.subject}>
                  {m.subject}
                </Text>
                <div className={styles.meta}>
                  <Text size={200}>{formatTimeRange(m.start, m.end)}</Text>
                  {m.isOnline ? (
                    <span className={styles.metaItem}>
                      <Video16Regular />
                      <Text size={200}>Online</Text>
                    </span>
                  ) : m.location ? (
                    <span className={styles.metaItem}>
                      <Location16Regular />
                      <Text size={200}>{m.location}</Text>
                    </span>
                  ) : null}
                </div>
              </div>
              <div className={styles.trailing}>
                {m.importance === 'high' && (
                  <Badge appearance="tint" color="danger" size="small">
                    Important
                  </Badge>
                )}
                <Text size={200} className={styles.until}>
                  {formatTimeUntil(m.start, now)}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingsList;
