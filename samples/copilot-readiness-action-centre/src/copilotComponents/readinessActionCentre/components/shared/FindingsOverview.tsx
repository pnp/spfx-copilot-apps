import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Option,
  ProgressBar,
  Text,
  Title1,
  Title2
} from '@fluentui/react-components';
import {
  ArrowExpand24Regular,
  CheckmarkCircle24Regular,
  ShieldError24Regular
} from '@fluentui/react-icons';
import { DashboardData, Finding, ICurrentUser, Severity } from '../../models/readiness';
import { useReadinessStyles } from './readinessStyles';

const severityColor = (
  s: Severity
): 'danger' | 'warning' | 'informative' | 'success' =>
  s === 'Critical' ? 'danger' : s === 'High' ? 'warning' : s === 'Medium' ? 'informative' : 'success';

export interface IFindingsOverviewProps {
  data: DashboardData;
  currentUser: ICurrentUser;
  density: 'inline' | 'fullscreen';
  initialSeverity?: string;
  showExpand: boolean;
  onExpand?: () => void;
  onSelectFinding: (finding: Finding) => void;
}

export const FindingsOverview: React.FC<IFindingsOverviewProps> = (props) => {
  const styles = useReadinessStyles();
  const [severity, setSeverity] = React.useState(props.initialSeverity || 'All');
  const findings = props.data.findings.filter(
    (f) => severity === 'All' || f.severity === severity
  );
  const criticalCount = props.data.findings.filter((x) => x.severity === 'Critical').length;
  const firstName = props.currentUser.displayName.split(' ')[0] || props.currentUser.displayName;

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Text className={styles.greeting} size={300}>
            Hi {firstName} — here is your Copilot readiness posture.
          </Text>
          <Title1>Copilot Readiness Action Centre</Title1>
          <Text className={styles.muted}>
            {props.data.assessment.tenantName} · Assessed{' '}
            {new Date(props.data.assessment.assessmentDate).toLocaleDateString()}
          </Text>
        </div>
        {props.showExpand && props.onExpand && (
          <Button
            icon={<ArrowExpand24Regular />}
            onClick={props.onExpand}
            aria-label="Expand to full screen"
          >
            Expand
          </Button>
        )}
      </div>
      <div className={props.density === 'fullscreen' ? styles.gridWide : styles.grid}>
        <Card className={styles.kpi}>
          <Text>Readiness score</Text>
          <Title1>{props.data.assessment.overallScore}%</Title1>
          <ProgressBar
            className={styles.bar}
            value={props.data.assessment.overallScore / 100}
          />
        </Card>
        <Card className={styles.kpi}>
          <ShieldError24Regular aria-hidden />
          <Text>Critical risks</Text>
          <Title1>{criticalCount}</Title1>
        </Card>
        <Card className={styles.kpi}>
          <Text>Open actions</Text>
          <Title1>{props.data.openActions}</Title1>
        </Card>
        <Card className={styles.kpi}>
          <CheckmarkCircle24Regular aria-hidden />
          <Text>Completed actions</Text>
          <Title1>{props.data.completedActions}</Title1>
        </Card>
      </div>
      <div className={styles.row}>
        <Title2>Readiness findings</Title2>
        <Dropdown
          value={severity}
          selectedOptions={[severity]}
          onOptionSelect={(_, d) => setSeverity(String(d.optionValue))}
          aria-label="Filter by severity"
        >
          {['All', 'Critical', 'High', 'Medium', 'Low'].map((x) => (
            <Option key={x} value={x}>
              {x}
            </Option>
          ))}
        </Dropdown>
      </div>
      <div className={styles.findings}>
        {findings.length === 0 ? (
          <Text className={styles.empty}>
            No findings match this filter. Enjoy the open calendar for remediation work.
          </Text>
        ) : (
          findings.map((f) => (
            <Card
              key={f.id}
              className={styles.finding}
              onClick={() => props.onSelectFinding(f)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  props.onSelectFinding(f);
                }
              }}
            >
              <div className={styles.row}>
                <div>
                  <Text weight="semibold" size={400}>
                    {f.title}
                  </Text>
                  <br />
                  <Text className={styles.muted}>
                    {f.category} · {f.affectedCount} affected
                  </Text>
                </div>
                <Badge appearance="filled" color={severityColor(f.severity)}>
                  {f.severity}
                </Badge>
              </div>
              <ProgressBar className={styles.bar} value={f.riskScore / 100} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
