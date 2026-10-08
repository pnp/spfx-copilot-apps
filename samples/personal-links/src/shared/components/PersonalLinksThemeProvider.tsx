import * as React from 'react';
import { createDOMRenderer, RendererProvider } from '@griffel/react';
import {
  FluentProvider,
  IdPrefixProvider,
  webDarkTheme,
  webLightTheme
} from '@fluentui/react-components';

export interface IPersonalLinksThemeProviderProps {
  children?: React.ReactNode;
  targetDocument: Document | undefined;
  theme: 'light' | 'dark';
}

export function PersonalLinksThemeProvider(
  props: IPersonalLinksThemeProviderProps
): React.ReactElement {
  const renderer = React.useMemo(
    () => createDOMRenderer(props.targetDocument),
    [props.targetDocument]
  );
  const [generation, setGeneration] = React.useState<number>(0);

  React.useEffect(() => {
    setGeneration(1);
  }, []);

  return (
    <RendererProvider renderer={renderer} targetDocument={props.targetDocument}>
      <IdPrefixProvider value="personal-links-">
        <FluentProvider
          key={generation}
          theme={props.theme === 'dark' ? webDarkTheme : webLightTheme}
          targetDocument={props.targetDocument}
        >
          {props.children}
        </FluentProvider>
      </IdPrefixProvider>
    </RendererProvider>
  );
}
