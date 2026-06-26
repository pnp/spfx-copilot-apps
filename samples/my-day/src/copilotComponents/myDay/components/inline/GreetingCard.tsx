import * as React from 'react';

import { Avatar, makeStyles, tokens, Text } from '@fluentui/react-components';
import {
  WeatherMoon24Filled,
  WeatherSunny24Filled,
  WeatherPartlyCloudyDay24Filled
} from '@fluentui/react-icons';

import type { IUser } from '../../models/myDay';
import { getGreeting, TimeOfDay } from '../../utils/greeting';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '16px',
    borderRadius: tokens.borderRadiusXLarge,
    color: tokens.colorNeutralForegroundOnBrand,
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorPaletteBerryBackground3} 100%)`
  },
  glyph: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: 'rgba(255, 255, 255, 0.18)'
  },
  body: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  greeting: {
    color: tokens.colorNeutralForegroundOnBrand,
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  subtext: {
    color: tokens.colorNeutralForegroundOnBrand,
    opacity: 0.85
  }
});

const glyphFor = (timeOfDay: TimeOfDay): React.ReactElement => {
  switch (timeOfDay) {
    case 'morning':
      return <WeatherSunny24Filled />;
    case 'afternoon':
      return <WeatherPartlyCloudyDay24Filled />;
    default:
      return <WeatherMoon24Filled />;
  }
};

export interface IGreetingCardProps {
  user: IUser;
  now: Date;
}

/** Personalized, time-aware greeting banner with the user's avatar. */
const GreetingCard: React.FunctionComponent<IGreetingCardProps> = (props) => {
  const styles = useStyles();
  const { user, now } = props;
  const greeting = getGreeting(now);

  return (
    <div className={styles.root}>
      <span className={styles.glyph}>{glyphFor(greeting.timeOfDay)}</span>
      <div className={styles.body}>
        <Text size={500} className={styles.greeting}>
          {greeting.text}, {user.firstName}
        </Text>
        <Text size={200} className={styles.subtext}>
          {greeting.subtext}
        </Text>
      </div>
      <Avatar name={user.displayName} image={user.photoUrl ? { src: user.photoUrl } : undefined} size={40} />
    </div>
  );
};

export default GreetingCard;
