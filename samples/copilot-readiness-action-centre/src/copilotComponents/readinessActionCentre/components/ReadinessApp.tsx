import * as React from 'react';
import { Spinner, Text, Title2 } from '@fluentui/react-components';
import { SPHttpClient } from '@microsoft/sp-http';
import { IReadinessActionCentreProperties } from '../ReadinessActionCentreCopilotComponentProperties';
import { DashboardData, Finding, ICurrentUser } from '../models/readiness';
import { createReadinessDataService } from '../services/createReadinessDataService';
import { IReadinessDataService } from '../services/IReadinessDataService';
import { ReadinessFullscreen } from './ReadinessFullscreen';
import { ReadinessInline } from './ReadinessInline';
import { ReadinessThemeProvider } from './ReadinessThemeProvider';
import { useReadinessStyles } from './shared/readinessStyles';

export interface IReadinessAppProps extends IReadinessActionCentreProperties {
  currentUser: ICurrentUser;
  theme?: string;
  displayMode?: string;
  availableDisplayModes?: string[];
  siteFallbackUrl: string;
  spHttpClient: SPHttpClient;
  onRequestFullscreen: () => void;
}

export const ReadinessApp: React.FC<IReadinessAppProps> = (props) => {
  const styles = useReadinessStyles();
  const [data, setData] = React.useState<DashboardData | undefined>();
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  const serviceRef = React.useRef<IReadinessDataService | undefined>();

  React.useEffect(() => {
    let cancelled = false;
    const site = props.siteUrl || props.siteFallbackUrl;
    const service = createReadinessDataService(
      props.useMockData,
      props.spHttpClient,
      site
    );
    serviceRef.current = service;

    setLoading(true);
    setError('');
    service
      .load(props.assessmentId)
      .then(
        (dashboard) => {
          if (!cancelled) {
            setData(dashboard);
            setLoading(false);
          }
        },
        (e: unknown) => {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : String(e));
            setLoading(false);
          }
        }
      );

    return () => {
      cancelled = true;
    };
  }, [
    props.assessmentId,
    props.siteUrl,
    props.siteFallbackUrl,
    props.useMockData,
    props.spHttpClient
  ]);

  const onCreate = React.useCallback(
    async (
      finding: Finding,
      resourceIds: number[],
      email: string,
      dueDate: string
    ): Promise<number> => {
      if (!serviceRef.current || !data) {
        return 0;
      }
      return serviceRef.current.createActions(
        {
          findingId: finding.id,
          resourceIds,
          assignedToEmail: email,
          dueDate,
          recommendedAction: finding.recommendation
        },
        data.resources
      );
    },
    [data]
  );

  const body = (): React.ReactNode => {
    if (loading) {
      return (
        <div className={styles.center}>
          <Spinner label="Loading readiness assessment..." />
        </div>
      );
    }
    if (error) {
      return (
        <div className={styles.root}>
          <Title2>Copilot Readiness Action Centre</Title2>
          <div className={styles.error}>{error}</div>
          <Text className={styles.muted}>
            Provision the SharePoint lists using scripts/provision.ps1, or invoke the tool with
            useMockData set to true.
          </Text>
        </div>
      );
    }
    if (!data) {
      return null;
    }

    const common = {
      data,
      currentUser: props.currentUser,
      initialSeverity: props.severity,
      onCreate
    };

    // Host-driven display mode — never mirrored in local state (§7)
    if (props.displayMode === 'fullscreen') {
      return <ReadinessFullscreen {...common} />;
    }
    return (
      <ReadinessInline
        {...common}
        onRequestFullscreen={props.onRequestFullscreen}
      />
    );
  };

  return <ReadinessThemeProvider theme={props.theme}>{body()}</ReadinessThemeProvider>;
};

export default ReadinessApp;
