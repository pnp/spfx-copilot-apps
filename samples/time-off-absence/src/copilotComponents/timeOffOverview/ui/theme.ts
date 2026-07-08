// Maps the SPFx Copilot host theme signal to a Fluent v9 theme. The host tells
// us only 'light' | 'dark'; we hand back the matching web theme so the whole
// component re-themes automatically when the user flips Copilot's appearance.

import {
  webLightTheme,
  webDarkTheme,
  type Theme
} from '@fluentui/react-components';

export function resolveTheme(mode: 'light' | 'dark' | undefined): Theme {
  return mode === 'dark' ? webDarkTheme : webLightTheme;
}
