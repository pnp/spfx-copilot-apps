import * as React from 'react';

import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { LeafOne16Regular, WeatherPartlyCloudyDayRegular } from '@fluentui/react-icons';

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
    fontSize: '32px',
    color: tokens.colorPaletteMarigoldForeground1
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
}

/** Compact current-conditions card for the full-screen hero (mock data). */
const WeatherCard: React.FunctionComponent<IWeatherCardProps> = ({ weather }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <span className={styles.glyph}>
        <WeatherPartlyCloudyDayRegular />
      </span>
      <div className={styles.info}>
        <span className={styles.tempRow}>
          <Text size={600} className={styles.temp}>
            {weather.temperatureC}°C
          </Text>
          <Text size={200} className={styles.tempAlt}>
            {weather.temperatureF}°F
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
