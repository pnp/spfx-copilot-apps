import * as React from 'react';

import { Button, makeStyles, tokens, Text } from '@fluentui/react-components';
import { ArrowLeft20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    paddingBottom: '4px'
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }
});

export interface IInlineDetailHeaderProps {
  title?: string;
  onBack: () => void;
}

/** Drill-down header with a back affordance and an optional section title. */
const InlineDetailHeader: React.FunctionComponent<IInlineDetailHeaderProps> = (props) => {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <Button
        appearance="subtle"
        size="small"
        icon={<ArrowLeft20Regular />}
        aria-label="Back to summary"
        onClick={props.onBack}
      />
      {props.title && (
        <Text size={400} className={styles.title}>
          {props.title}
        </Text>
      )}
    </div>
  );
};

export default InlineDetailHeader;
