import * as React from 'react';
import {
  FluentProvider,
  IdPrefixProvider,
  webLightTheme,
  webDarkTheme,
  type Theme
} from '@fluentui/react-components';

import type { SPCopilotTheme } from '@microsoft/sp-copilot-component';

export interface IExecDashboardThemeProviderProps {
  /** Host-advertised theme ('light' | 'dark'), if any. */
  hostTheme: SPCopilotTheme | undefined;
  /** Document to inject Griffel styles into (the iframe document). */
  targetDocument: Document | undefined;
  children: React.ReactNode;
}

/**
 * Single Fluent v9 theme provider for the whole dashboard.
 *
 * Follows the Copilot host theme (light/dark). Remounts the `FluentProvider`
 * exactly once after first commit (via a key that flips 0 -> 1) to work around
 * the iframe style-insertion timing. The key is stable thereafter, so a later
 * host theme flip only swaps tokens — no remount, no flicker, no lost state.
 */
export default function ExecDashboardThemeProvider(props: IExecDashboardThemeProviderProps): React.ReactElement {
  const { hostTheme, targetDocument, children } = props;

  const [gen, setGen] = React.useState<number>(0);
  React.useEffect(() => setGen(1), []);

  const theme: Theme = hostTheme === 'dark' ? webDarkTheme : webLightTheme;

  return (
    <IdPrefixProvider value="exec-dashboard-">
      <FluentProvider key={gen} theme={theme} targetDocument={targetDocument}>
        {children}
      </FluentProvider>
    </IdPrefixProvider>
  );
}
