import * as React from 'react';

import { makeStyles, Spinner, tokens, Text } from '@fluentui/react-components';
import {
  CalendarLtr20Regular,
  CheckmarkCircle20Regular,
  Clock20Regular,
  Mail20Regular,
  News20Regular,
  Sparkle20Regular
} from '@fluentui/react-icons';

import type { FocusSource, IFocusItem } from '../../models/focusPlan';
import type { IMyDayData } from '../../models/myDay';
import { planMyDay } from '../../services/planMyDay';
import RightPanel from './RightPanel';

const useStyles = makeStyles({
  thinking: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    minHeight: '200px',
    color: tokens.colorNeutralForeground3
  },
  headline: {
    color: tokens.colorNeutralForeground2,
    marginBottom: '16px'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  item: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    borderRadius: tokens.borderRadiusLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2,
    position: 'relative',
    overflow: 'hidden'
  },
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '4px',
    backgroundColor: tokens.colorBrandStroke1
  },
  rank: {
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground1
  },
  content: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  titleRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0
  },
  sourceIcon: {
    flexShrink: 0,
    display: 'inline-flex',
    color: tokens.colorNeutralForeground3
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  reason: {
    color: tokens.colorNeutralForeground3
  },
  timeChip: {
    alignSelf: 'flex-start',
    marginTop: '4px',
    padding: '1px 8px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2
  }
});

const SOURCE_ICON: Record<FocusSource, React.ReactElement> = {
  meeting: <CalendarLtr20Regular />,
  task: <CheckmarkCircle20Regular />,
  mail: <Mail20Regular />,
  news: <News20Regular />,
  focus: <Clock20Regular />
};

export interface IPlanMyDayPanelProps {
  data: IMyDayData;
  now: Date;
  onDismiss: () => void;
}

/** Right drawer that simulates an assistant briefing, then renders the focus plan. */
const PlanMyDayPanel: React.FunctionComponent<IPlanMyDayPanelProps> = ({ data, now, onDismiss }) => {
  const styles = useStyles();
  const [thinking, setThinking] = React.useState(true);

  const plan = React.useMemo(() => planMyDay(data, now), [data, now]);

  React.useEffect(() => {
    const handle = window.setTimeout(() => setThinking(false), 900);
    return () => window.clearTimeout(handle);
  }, []);

  return (
    <RightPanel
      title="Plan my day"
      icon={<Sparkle20Regular />}
      onDismiss={onDismiss}
      footnote="AI-generated suggestions for this demo are based on sample data and are not saved."
    >
      {thinking ? (
        <div className={styles.thinking}>
          <Spinner size="medium" />
          <Text>Analyzing your day…</Text>
        </div>
      ) : (
        <>
          <Text size={300} className={styles.headline} block>
            {plan.headline}
          </Text>
          <div className={styles.list}>
            {plan.items.map((item: IFocusItem, index: number) => (
              <div key={item.id} className={styles.item}>
                <span className={styles.rail} />
                <span className={styles.rank}>{index + 1}</span>
                <div className={styles.content}>
                  <span className={styles.titleRow}>
                    <span className={styles.sourceIcon}>{SOURCE_ICON[item.source]}</span>
                    <Text className={styles.title}>{item.title}</Text>
                  </span>
                  <Text size={200} className={styles.reason}>
                    {item.reason}
                  </Text>
                  {item.suggestedTime && (
                    <Text size={200} className={styles.timeChip}>
                      {item.suggestedTime}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </RightPanel>
  );
};

export default PlanMyDayPanel;
