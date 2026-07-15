import * as React from 'react';
import {
  Caption1,
  Card,
  Title3,
  makeStyles,
  tokens
} from '@fluentui/react-components';

import type { IPermissionsSummary } from '../models/IPermissionsSummary';

export interface IAccessSummaryCardsProps {
  summary: IPermissionsSummary;
}

const useStyles = makeStyles({
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM
  },
  card: {
    minWidth: '140px',
    padding: tokens.spacingVerticalS,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  label: {
    color: tokens.colorNeutralForeground3
  }
});

interface ICardProps {
  label: string;
  value: number;
}

const StatCard: React.FC<ICardProps> = ({ label, value }) => {
  const styles = useStyles();
  return (
    <Card className={styles.card} aria-label={`${label}: ${value}`}>
      <Title3>{value}</Title3>
      <Caption1 className={styles.label}>{label}</Caption1>
    </Card>
  );
};

export const AccessSummaryCards: React.FC<IAccessSummaryCardsProps> = ({ summary }) => {
  const styles = useStyles();

  return (
    <div className={styles.row} role="group" aria-label="Access summary">
      <StatCard label="Total principals" value={summary.totalPrincipals} />
      <StatCard label="Users" value={summary.userCount} />
      <StatCard label="SharePoint groups" value={summary.groupCount} />
      <StatCard label="M365 groups" value={summary.m365GroupCount} />
      <StatCard label="External users" value={summary.externalUserCount} />
    </div>
  );
};

export default AccessSummaryCards;
