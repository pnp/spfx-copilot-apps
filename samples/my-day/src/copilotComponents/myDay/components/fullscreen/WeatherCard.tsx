import * as React from 'react';

import { makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';
import {
  LeafOne16Regular,
  WeatherCloudyRegular,
  WeatherMoonRegular,
  WeatherPartlyCloudyDayRegular,
  WeatherPartlyCloudyNightRegular,
  WeatherRainRegular,
  WeatherSnowRegular,
  WeatherSunnyRegular
} from '@fluentui/react-icons';

import type { IWeather } from '../../models/myDay';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxSizing: 'border-box',
    padding: '12px 16px',
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2
  },
  glyph: {
    flexShrink: 0,
    display: 'inline-flex',
    fontSize: '32px'
  },
  glyphWarm: {
    color: tokens.colorPaletteMarigoldForeground1
  },
  glyphCool: {
    color: tokens.colorNeutralForeground2
  },
  info: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  },
  tempRow: {
    display: 'inline-flex',
    alignItems: 'baseline',
    gap: '6px'
  },
  temp: {
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: '1'
  },
  tempAlt: {
    color: tokens.colorNeutralForeground3
  },
  condition: {
    color: tokens.colorNeutralForeground2
  },
  meta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '2px',
    color: tokens.colorNeutralForeground3
  },
  aqi: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    color: tokens.colorPaletteGreenForeground1
  }
});

export interface IWeatherCardProps {
  weather: IWeather;
  /** Current clock, used to pick a day vs. night weather glyph. */
  now: Date;
  /** When `true`, show Fahrenheit as the primary temperature. */
  useFahrenheit?: boolean;
}

/** Picks a condition- and time-aware weather glyph plus a warm/cool accent. */
const glyphFor = (condition: string, now: Date): { icon: React.ReactElement; warm: boolean } => {
  const c = condition.toLowerCase();
  const hour = now.getHours();
  const night = hour < 6 || hour >= 20;

  if (c.includes('snow') || c.includes('sleet') || c.includes('flurr')) {
    return { icon: <WeatherSnowRegular />, warm: false };
  }
  if (c.includes('rain') || c.includes('shower') || c.includes('drizzle') || c.includes('storm')) {
    return { icon: <WeatherRainRegular />, warm: false };
  }
  if (c.includes('partly') || c.includes('partial') || c.includes('mostly sunny')) {
    return {
      icon: night ? <WeatherPartlyCloudyNightRegular /> : <WeatherPartlyCloudyDayRegular />,
      warm: !night
    };
  }
  if (c.includes('cloud') || c.includes('overcast') || c.includes('fog') || c.includes('mist') || c.includes('haze')) {
    return { icon: <WeatherCloudyRegular />, warm: false };
  }
  // Clear / sunny / default.
  return night
    ? { icon: <WeatherMoonRegular />, warm: false }
    : { icon: <WeatherSunnyRegular />, warm: true };
};

/** Compact current-conditions card for the full-screen hero (mock data). */
const WeatherCard: React.FunctionComponent<IWeatherCardProps> = ({ weather, now, useFahrenheit }) => {
  const styles = useStyles();

  const glyph = glyphFor(weather.condition, now);

  const primary = useFahrenheit
    ? `${weather.temperatureF}°F`
    : `${weather.temperatureC}°C`;
  const secondary = useFahrenheit
    ? `${weather.temperatureC}°C`
    : `${weather.temperatureF}°F`;

  return (
    <div className={styles.root}>
      <span className={mergeClasses(styles.glyph, glyph.warm ? styles.glyphWarm : styles.glyphCool)}>
        {glyph.icon}
      </span>
      <div className={styles.info}>
        <span className={styles.tempRow}>
          <Text size={600} className={styles.temp}>
            {primary}
          </Text>
          <Text size={200} className={styles.tempAlt}>
            {secondary}
          </Text>
        </span>
        <Text size={200} className={styles.condition}>
          {weather.condition} · {weather.location}
        </Text>
        <span className={styles.meta}>
          <span className={styles.aqi}>
            <LeafOne16Regular />
            <Text size={200}>
              AQI {weather.airQualityIndex} · {weather.airQualityLabel}
            </Text>
          </span>
        </span>
      </div>
    </div>
  );
};

export default WeatherCard;
