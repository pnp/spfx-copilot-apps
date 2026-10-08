import * as React from 'react';
import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  tokens
} from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    padding: tokens.spacingHorizontalL
  }
});

export interface IPersonalLinksErrorBoundaryProps {
  children?: React.ReactNode;
}

interface IPersonalLinksErrorBoundaryState {
  hasError: boolean;
}

export class PersonalLinksErrorBoundary extends React.Component<
  IPersonalLinksErrorBoundaryProps,
  IPersonalLinksErrorBoundaryState
> {
  public state: IPersonalLinksErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): IPersonalLinksErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Personal Links could not render.', error, errorInfo);
  }

  public render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return <PersonalLinksRecovery onRetry={() => this.setState({ hasError: false })} />;
  }
}

function PersonalLinksRecovery(props: { onRetry: () => void }): React.ReactElement {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <MessageBar intent="error">
        <MessageBarBody>
          Personal Links could not display this view. Your OneDrive file was not changed.
        </MessageBarBody>
        <MessageBarActions>
          <Button appearance="primary" onClick={props.onRetry}>Try again</Button>
        </MessageBarActions>
      </MessageBar>
    </div>
  );
}
