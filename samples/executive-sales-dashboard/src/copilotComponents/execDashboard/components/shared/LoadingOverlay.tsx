import * as React from 'react';
import { Spinner, makeStyles, tokens } from '@fluentui/react-components';

export interface ILoadingOverlayProps {
  label: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: '160px',
    padding: tokens.spacingVerticalXXL,
    boxSizing: 'border-box'
  }
});

/**
 * Centred loading spinner shown while `isDataLoading` is true, before the
 * dashboard content is rendered.
 */
export default function LoadingOverlay(props: ILoadingOverlayProps): React.ReactElement {
  const { label } = props;
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Spinner label={label} />
    </div>
  );
}
