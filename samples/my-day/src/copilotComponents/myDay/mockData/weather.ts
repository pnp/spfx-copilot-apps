import type { IWeather } from '../models/myDay';

/**
 * Mock current-conditions weather for the full-screen hero. **Demo only** — not
 * Graph-shaped; a real implementation would call a weather service for the
 * user's configured location.
 */
export const mockWeather: IWeather = {
  temperatureC: 21,
  temperatureF: 70,
  condition: 'Partly cloudy',
  location: 'Redmond, WA',
  airQualityIndex: 24,
  airQualityLabel: 'Good'
};
