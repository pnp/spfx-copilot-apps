import * as React from 'react';

import { Avatar, makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';
import { Flag16Filled, Mail20Regular } from '@fluentui/react-icons';

import type { IMailItem } from '../../models/myDay';
import { formatTimeAgo } from '../../utils/datetime';
import DashboardCard from './DashboardCard';

const useStyles = makeStyles({
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    width: '100%'
  },
  row: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    minWidth: 0,
    padding: '10px 8px',
    borderRadius: tokens.borderRadiusLarge,
    boxSizing: 'border-box',
    transitionProperty: 'background-color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover
    }
  },
  avatarWrap: {
    flexShrink: 0,
    position: 'relative'
  },
  unreadDot: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground,
    border: `2px solid ${tokens.colorNeutralBackground1}`,
    boxSizing: 'border-box'
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '1px'
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0
  },
  from: {
    flexGrow: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  fromUnread: {
    fontWeight: tokens.fontWeightSemibold
  },
  time: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3,
    whiteSpace: 'nowrap'
  },
  subjectRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0
  },
  flag: {
    flexShrink: 0,
    color: tokens.colorPaletteRedForeground1
  },
  subject: {
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: tokens.colorNeutralForeground1
  },
  preview: {
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    padding: '8px 0'
  }
});

export interface IImportantMailProps {
  mail: IMailItem[];
  now: Date;
}

/** Important / flagged inbox highlights with sender face avatars. */
const ImportantMail: React.FunctionComponent<IImportantMailProps> = ({ mail, now }) => {
  const styles = useStyles();

  const items = React.useMemo(() => {
    const important = mail.filter((m) => m.importance === 'high' || m.flagged || !m.isRead);
    const source = important.length > 0 ? important : mail;
    return [...source].sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());
  }, [mail]);

  return (
    <DashboardCard title="Important mail" icon={<Mail20Regular />} action={{ label: 'Open Outlook' }}>
      {items.length === 0 ? (
        <Text className={styles.empty}>You&apos;re all caught up on important mail.</Text>
      ) : (
        <div className={styles.list}>
          {items.map((m) => (
            <div key={m.id} className={styles.row}>
              <div className={styles.avatarWrap}>
                <Avatar
                  size={36}
                  name={m.from}
                  image={m.senderPhotoUrl ? { src: m.senderPhotoUrl } : undefined}
                />
                {!m.isRead && <span className={styles.unreadDot} />}
              </div>
              <div className={styles.content}>
                <div className={styles.topRow}>
                  <Text className={mergeClasses(styles.from, !m.isRead && styles.fromUnread)}>
                    {m.from}
                  </Text>
                  <Text size={200} className={styles.time}>
                    {formatTimeAgo(m.receivedAt, now)}
                  </Text>
                </div>
                <div className={styles.subjectRow}>
                  {m.flagged && <Flag16Filled className={styles.flag} />}
                  <Text size={300} className={styles.subject}>
                    {m.subject}
                  </Text>
                </div>
                <Text size={200} className={styles.preview}>
                  {m.preview}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
};

export default ImportantMail;
