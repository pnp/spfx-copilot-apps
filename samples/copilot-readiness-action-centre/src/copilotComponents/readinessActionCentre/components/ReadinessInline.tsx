import * as React from 'react';
import { DashboardData, Finding, ICurrentUser } from '../models/readiness';
import { FindingDetail } from './shared/FindingDetail';
import { FindingsOverview } from './shared/FindingsOverview';
import { useReadinessStyles } from './shared/readinessStyles';

export interface IReadinessInlineProps {
  data: DashboardData;
  currentUser: ICurrentUser;
  initialSeverity?: string;
  onRequestFullscreen: () => void;
  onCreate: (
    finding: Finding,
    resourceIds: number[],
    email: string,
    dueDate: string
  ) => Promise<number>;
}

export const ReadinessInline: React.FC<IReadinessInlineProps> = (props) => {
  const styles = useReadinessStyles();
  const [selected, setSelected] = React.useState<Finding | undefined>();

  return (
    <div className={styles.root}>
      {selected ? (
        <FindingDetail
          data={props.data}
          finding={selected}
          defaultOwnerEmail={props.currentUser.email}
          onBack={() => setSelected(undefined)}
          onCreate={props.onCreate}
        />
      ) : (
        <FindingsOverview
          data={props.data}
          currentUser={props.currentUser}
          density="inline"
          initialSeverity={props.initialSeverity}
          showExpand={true}
          onExpand={props.onRequestFullscreen}
          onSelectFinding={setSelected}
        />
      )}
    </div>
  );
};
