import * as React from 'react';
import { Card, Body1, Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  DataTrending20Regular,
  Trophy20Regular,
  People20Regular,
  Sparkle20Filled
} from '@fluentui/react-icons';

import type { IInsight } from '../../models/dashboard';

export interface IInsightsPanelProps {
  title: string;
  insights: IInsight[];
}

const useStyles = makeStyles({
  card: {
    padding: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalM
  },
  header: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS
  },
  headerIcon: {
    color: tokens.colorBrandForeground1
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL
  },
  row: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalM
  },
  icon: {
    color: tokens.colorBrandForeground1,
    flexShrink: 0,
    marginTop: tokens.spacingVerticalXXS
  },
  text: {
    color: tokens.colorNeutralForeground2
  }
});

function iconFor(icon: IInsight['icon']): React.ReactElement {
  switch (icon) {
    case 'win':
      return <Trophy20Regular />;
    case 'customers':
      return <People20Regular />;
    case 'trend':
    default:
      return <DataTrending20Regular />;
  }
}

/** Generated insights list. */
export default function InsightsPanel(props: IInsightsPanelProps): React.ReactElement {
  const { title, insights } = props;
  const styles = useStyles();

  return (
    <Card className={styles.card}>
      <span className={styles.header}>
        <Sparkle20Filled className={styles.headerIcon} aria-hidden />
        <Text weight="semibold">{title}</Text>
      </span>
      <div className={styles.list}>
        {insights.map((insight) => (
          <div key={insight.id} className={styles.row}>
            <span className={styles.icon} aria-hidden>{iconFor(insight.icon)}</span>
            <Body1 className={styles.text}>{insight.text}</Body1>
          </div>
        ))}
      </div>
    </Card>
  );
}
