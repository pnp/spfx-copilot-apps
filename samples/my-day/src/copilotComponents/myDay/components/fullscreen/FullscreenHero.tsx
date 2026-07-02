import * as React from 'react';

import { Avatar, Button, makeStyles, tokens, Text } from '@fluentui/react-components';
import { Settings24Regular } from '@fluentui/react-icons';

import type { IUser, IWeather } from '../../models/myDay';
import { formatFullDate } from '../../utils/datetime';
import { getGreeting } from '../../utils/greeting';
import WeatherCard from './WeatherCard';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
    width: '100%',
    boxSizing: 'border-box'
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexGrow: 1,
    minWidth: '240px'
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    minWidth: 0
  },
  greeting: {
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1.1'
  },
  date: {
    color: tokens.colorNeutralForeground3
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0
  }
});

export interface IFullscreenHeroProps {
  user: IUser;
  weather?: IWeather;
  now: Date;
  /** When `true`, the weather card shows Fahrenheit as the primary unit. */
  useFahrenheit?: boolean;
  onOpenSettings: () => void;
}

/** Full-screen header: avatar, time-aware greeting, live date, weather and settings. */
const FullscreenHero: React.FunctionComponent<IFullscreenHeroProps> = (props) => {
  const styles = useStyles();
  const { user, weather, now, useFahrenheit, onOpenSettings } = props;
  const greeting = getGreeting(now);

  return (
    <div className={styles.root}>
      <div className={styles.identity}>
        <Avatar size={72} name={user.displayName} image={user.photoUrl ? { src: user.photoUrl } : undefined} />
        <div className={styles.text}>
          <Text size={800} className={styles.greeting}>
            {greeting.text}, {user.firstName} 👋
          </Text>
          <Text size={400} className={styles.date}>
            {formatFullDate(now)}
          </Text>
        </div>
      </div>
      <div className={styles.right}>
        {weather && <WeatherCard weather={weather} now={now} useFahrenheit={useFahrenheit} />}
        <Button
          appearance="subtle"
          shape="circular"
          icon={<Settings24Regular />}
          aria-label="Settings"
          onClick={onOpenSettings}
        />
      </div>
    </div>
  );
};

export default FullscreenHero;
