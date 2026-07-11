import * as React from 'react';
import {
  Body1,
  Caption1,
  Title3,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { SearchRegular } from '@fluentui/react-icons';

export interface IEmptyStateProps {
  title?: string;
  message: string;
  hint?: string;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
    color: tokens.colorNeutralForeground2
  },
  icon: {
    fontSize: '32px',
    color: tokens.colorNeutralForeground3
  }
});

export const EmptyState: React.FC<IEmptyStateProps> = ({ title, message, hint }) => {
  const styles = useStyles();
  return (
    <div className={styles.root} role="status">
      <SearchRegular className={styles.icon} aria-hidden="true" />
      {title && <Title3>{title}</Title3>}
      <Body1>{message}</Body1>
      {hint && <Caption1>{hint}</Caption1>}
    </div>
  );
};

export default EmptyState;
