import * as React from 'react';

import { Button, makeStyles, tokens, Text } from '@fluentui/react-components';
import { Sparkle24Filled } from '@fluentui/react-icons';

import type { IMyDayData } from '../../models/myDay';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    width: '100%',
    boxSizing: 'border-box',
    padding: '16px 20px',
    borderRadius: tokens.borderRadiusXLarge,
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundImage: `linear-gradient(120deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorCompoundBrandBackgroundPressed} 100%)`,
    boxShadow: tokens.shadow8
  },
  glyph: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: 'rgba(255, 255, 255, 0.18)'
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flexGrow: 1,
    minWidth: '200px'
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForegroundOnBrand
  },
  subtitle: {
    color: tokens.colorNeutralForegroundOnBrand,
    opacity: 0.9
  },
  button: {
    flexShrink: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorBrandForeground1,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      color: tokens.colorBrandForeground1
    },
    ':hover:active': {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
      color: tokens.colorBrandForeground1
    }
  }
});

export interface IPlanYourDayBannerProps {
  data: IMyDayData;
  now: Date;
  onPlan: () => void;
}

const buildTagline = (data: IMyDayData, now: Date): string => {
  const meetingsAhead = data.meetings.filter((m) => m.end.getTime() > now.getTime()).length;
  const highTasks = data.tasks.filter((t) => !t.completed && t.importance === 'high').length;

  if (meetingsAhead === 0 && highTasks === 0) {
    return 'Your schedule is clear — a great moment to get ahead.';
  }

  const parts: string[] = [];
  if (meetingsAhead > 0) {
    parts.push(`${meetingsAhead} meeting${meetingsAhead === 1 ? '' : 's'}`);
  }
  if (highTasks > 0) {
    parts.push(`${highTasks} high-priority task${highTasks === 1 ? '' : 's'}`);
  }
  return `You have ${parts.join(' and ')} ahead. Let me prioritize them for you.`;
};

/** Full-width call-to-action that opens the "Plan my day" briefing. */
const PlanYourDayBanner: React.FunctionComponent<IPlanYourDayBannerProps> = (props) => {
  const styles = useStyles();
  const { data, now, onPlan } = props;

  return (
    <div className={styles.root}>
      <span className={styles.glyph}>
        <Sparkle24Filled />
      </span>
      <div className={styles.text}>
        <Text size={500} className={styles.title}>
          Start your day smart
        </Text>
        <Text size={300} className={styles.subtitle}>
          {buildTagline(data, now)}
        </Text>
      </div>
      <Button
        appearance="primary"
        size="large"
        className={styles.button}
        icon={<Sparkle24Filled />}
        onClick={onPlan}
      >
        Plan my day
      </Button>
    </div>
  );
};

export default PlanYourDayBanner;
