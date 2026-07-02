import * as React from 'react';

import { makeStyles, mergeClasses, shorthands, tokens, Text } from '@fluentui/react-components';
import {
  ConferenceRoom24Regular,
  Flash20Regular,
  Note24Regular,
  CalendarPerson24Regular
} from '@fluentui/react-icons';

import type { IQuickAction } from '../../models/myDay';
import DashboardCard from './DashboardCard';

const useStyles = makeStyles({
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%'
  },
  action: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    textAlign: 'left',
    padding: '12px',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    boxShadow: tokens.shadow2,
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color, border-color, box-shadow',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow8
    }
  },
  icon: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  title: {
    color: tokens.colorNeutralForeground1,
    fontWeight: tokens.fontWeightSemibold
  },
  description: {
    color: tokens.colorNeutralForeground3
  }
});

const ICONS: Record<IQuickAction['icon'], React.ReactElement> = {
  room: <ConferenceRoom24Regular />,
  note: <Note24Regular />,
  timeoff: <CalendarPerson24Regular />
};

export interface IQuickActionsPanelProps {
  actions: IQuickAction[];
}

/** Row of illustrative quick-action tiles (no-op in the mock). */
const QuickActionsPanel: React.FunctionComponent<IQuickActionsPanelProps> = ({ actions }) => {
  const styles = useStyles();

  return (
    <DashboardCard title="Quick actions" icon={<Flash20Regular />}>
      <div className={styles.grid}>
        {actions.map((a) => (
          <button key={a.id} type="button" className={mergeClasses(styles.action)}>
            <span className={styles.icon}>{ICONS[a.icon]}</span>
            <span className={styles.text}>
              <Text className={styles.title}>{a.title}</Text>
              <Text size={200} className={styles.description}>
                {a.description}
              </Text>
            </span>
          </button>
        ))}
      </div>
    </DashboardCard>
  );
};

export default QuickActionsPanel;
