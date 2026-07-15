import * as React from 'react';
import { FluentProvider, makeStyles, webDarkTheme, webLightTheme } from '@fluentui/react-components';

export interface IReadinessThemeProviderProps {
  theme?: string;
  children: React.ReactNode;
}

const useStyles = makeStyles({
  provider: {
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    minHeight: '100%'
  }
});

/**
 * Single FluentProvider with one-time remount key so theme flips only swap
 * tokens (agentic-creation-rules §8).
 */
export const ReadinessThemeProvider: React.FC<IReadinessThemeProviderProps> = (props) => {
  const styles = useStyles();
  const [gen, setGen] = React.useState(0);
  React.useEffect(() => {
    setGen(1);
  }, []);

  const fluentTheme = props.theme === 'dark' ? webDarkTheme : webLightTheme;

  return (
    <FluentProvider key={gen} theme={fluentTheme} className={styles.provider}>
      {props.children}
    </FluentProvider>
  );
};
