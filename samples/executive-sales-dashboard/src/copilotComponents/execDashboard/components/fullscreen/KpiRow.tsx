import * as React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';
import {
  Money20Regular,
  DataPie20Regular,
  Trophy20Regular,
  PeopleTeam20Regular
} from '@fluentui/react-icons';

import type { IKpiMetric } from '../../models/dashboard';
import KpiCard from './KpiCard';

export interface IKpiRowProps {
  kpis: IKpiMetric[];
}

const useStyles = makeStyles({
  root: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalM
  }
});

function iconFor(id: string): React.ReactElement {
  switch (id) {
    case 'margin':
      return <DataPie20Regular />;
    case 'winrate':
      return <Trophy20Regular />;
    case 'customers':
      return <PeopleTeam20Regular />;
    case 'revenue':
    default:
      return <Money20Regular />;
  }
}

/** Responsive row of the four headline KPI cards. */
export default function KpiRow(props: IKpiRowProps): React.ReactElement {
  const { kpis } = props;
  const styles = useStyles();

  return (
    <div className={styles.root}>
      {kpis.map((metric) => (
        <KpiCard key={metric.id} metric={metric} icon={iconFor(metric.id)} />
      ))}
    </div>
  );
}
