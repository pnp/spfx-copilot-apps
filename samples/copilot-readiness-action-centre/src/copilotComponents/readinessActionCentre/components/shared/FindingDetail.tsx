import * as React from 'react';
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Field,
  Input,
  Spinner,
  Text,
  Title1,
  Title2
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { DashboardData, Finding, Severity } from '../../models/readiness';
import { useReadinessStyles } from './readinessStyles';

const severityColor = (
  s: Severity
): 'danger' | 'warning' | 'informative' | 'success' =>
  s === 'Critical' ? 'danger' : s === 'High' ? 'warning' : s === 'Medium' ? 'informative' : 'success';

export interface IFindingDetailProps {
  data: DashboardData;
  finding: Finding;
  defaultOwnerEmail?: string;
  onBack: () => void;
  onCreate: (
    finding: Finding,
    resourceIds: number[],
    email: string,
    dueDate: string
  ) => Promise<number>;
}

export const FindingDetail: React.FC<IFindingDetailProps> = (props) => {
  const styles = useReadinessStyles();
  const [ids, setIds] = React.useState<number[]>([]);
  const [email, setEmail] = React.useState(props.defaultOwnerEmail || '');
  const [date, setDate] = React.useState(
    new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
  );
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');

  const resources = props.data.resources.filter((r) => r.findingId === props.finding.id);

  const create = async (): Promise<void> => {
    if (!ids.length || !email || !date) {
      setMessage('Select at least one resource, enter an owner email and choose a due date.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const n = await props.onCreate(props.finding, ids, email, date);
      setMessage(`${n} remediation action${n === 1 ? '' : 's'} created successfully.`);
      setIds([]);
    } catch (e) {
      setMessage(`Could not create actions: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <Button
            appearance="subtle"
            icon={<ArrowLeft24Regular />}
            onClick={props.onBack}
            aria-label="Back to findings"
          >
            Back to findings
          </Button>
          <Title1>{props.finding.title}</Title1>
          <div>
            <Badge appearance="filled" color={severityColor(props.finding.severity)}>
              {props.finding.severity}
            </Badge>{' '}
            <Text className={styles.muted}>
              {props.finding.category} · Risk score {props.finding.riskScore}
            </Text>
          </div>
        </div>
      </div>
      <div className={styles.detailGrid}>
        <Card className={styles.panel}>
          <Title2>Review the evidence</Title2>
          <p>{props.finding.description}</p>
          <Text weight="semibold">Evidence</Text>
          <p>{props.finding.evidence}</p>
          <Text weight="semibold">Recommended action</Text>
          <p>{props.finding.recommendation}</p>
          <Title2>Affected resources</Title2>
          <div className={styles.resources}>
            {resources.length ? (
              resources.map((r) => (
                <div className={styles.resource} key={r.id}>
                  <Checkbox
                    checked={ids.includes(r.id)}
                    onChange={(_, d) =>
                      setIds((x) =>
                        d.checked ? [...x, r.id] : x.filter((i) => i !== r.id)
                      )
                    }
                    label={
                      <div>
                        <Text weight="semibold">{r.title}</Text>
                        <br />
                        <Text size={200} className={styles.muted}>
                          {r.exposureType} · {r.itemCount.toLocaleString()} items ·{' '}
                          {r.siteOwner || 'No owner'}
                        </Text>
                      </div>
                    }
                  />
                </div>
              ))
            ) : (
              <Text className={styles.empty}>
                No affected resources are linked to this finding. You are in good shape for this
                item.
              </Text>
            )}
          </div>
        </Card>
        <Card className={styles.panel}>
          <Title2>Create remediation actions</Title2>
          <div className={styles.actions}>
            <Text>
              {ids.length} resource{ids.length === 1 ? '' : 's'} selected
            </Text>
            <Field label="Assigned owner email" required>
              <Input
                type="email"
                value={email}
                onChange={(_, d) => setEmail(d.value)}
                placeholder="owner@contoso.com"
              />
            </Field>
            <Field label="Due date" required>
              <Input type="date" value={date} onChange={(_, d) => setDate(d.value)} />
            </Field>
            <Button appearance="primary" disabled={busy} onClick={create}>
              {busy ? <Spinner size="tiny" /> : 'Create remediation actions'}
            </Button>
            {message && (
              <div
                className={
                  message.includes('successfully') ? styles.success : styles.error
                }
              >
                {message}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
