import * as React from 'react';
import { DashboardData, Finding, ICurrentUser } from '../models/readiness';
import { FindingDetail } from './shared/FindingDetail';
import { FindingsOverview } from './shared/FindingsOverview';
import { useReadinessStyles } from './shared/readinessStyles';

export interface IReadinessFullscreenProps {
  data: DashboardData;
  currentUser: ICurrentUser;
  initialSeverity?: string;
  onCreate: (
    finding: Finding,
    resourceIds: number[],
    email: string,
    dueDate: string
  ) => Promise<number>;
}

export const ReadinessFullscreen: React.FC<IReadinessFullscreenProps> = (props) => {
  const styles = useReadinessStyles();
  const [selected, setSelected] = React.useState<Finding | undefined>();

  return (
    <div className={styles.rootWide}>
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
          density="fullscreen"
          initialSeverity={props.initialSeverity}
          showExpand={false}
          onSelectFinding={setSelected}
        />
      )}
    </div>
  );
};
