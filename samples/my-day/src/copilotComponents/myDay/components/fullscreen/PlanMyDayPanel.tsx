import * as React from 'react';

import { makeStyles, mergeClasses, Spinner, tokens, Text } from '@fluentui/react-components';
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
import { fadeInUp } from '../../utils/motion';
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
  shimmer: {
    height: '3px',
    width: '100%',
    marginBottom: '14px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundImage: `linear-gradient(90deg, ${tokens.colorNeutralBackground3} 0%, ${tokens.colorBrandBackground} 50%, ${tokens.colorNeutralBackground3} 100%)`,
    backgroundSize: '200% 100%',
    backgroundRepeat: 'no-repeat',
    animationName: {
      from: { backgroundPositionX: '200%' },
      to: { backgroundPositionX: '-200%' }
    },
    animationDuration: '1.3s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'linear',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none'
    }
  },
  itemEnter: {
    animationName: fadeInUp,
    animationDuration: tokens.durationSlow,
    animationTimingFunction: tokens.curveDecelerateMid,
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': {
      animationName: 'none',
      animationDuration: '1ms'
    }
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

/** Right drawer that simulates an assistant briefing, then streams the focus plan. */
const PlanMyDayPanel: React.FunctionComponent<IPlanMyDayPanelProps> = ({ data, now, onDismiss }) => {
  const styles = useStyles();
  const [phase, setPhase] = React.useState<'thinking' | 'streaming' | 'done'>('thinking');
  const [revealed, setRevealed] = React.useState(0);

  const plan = React.useMemo(() => planMyDay(data, now), [data, now]);

  // Kick off: a brief "thinking" pause, then stream the items in one by one.
  // Honors reduced-motion by revealing everything at once.
  React.useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      setRevealed(plan.items.length);
      setPhase('done');
      return;
    }

    const handle = window.setTimeout(() => setPhase('streaming'), 800);
    return () => window.clearTimeout(handle);
  }, [plan.items.length]);

  // Streamed reveal: mount one recommendation at a time for the "composing" feel.
  React.useEffect(() => {
    if (phase !== 'streaming') {
      return;
    }
    if (revealed >= plan.items.length) {
      setPhase('done');
      return;
    }
    const handle = window.setTimeout(() => setRevealed((count) => count + 1), 220);
    return () => window.clearTimeout(handle);
  }, [phase, revealed, plan.items.length]);

  const generating = phase !== 'done';

  return (
    <RightPanel
      title="Plan my day"
      icon={<Sparkle20Regular />}
      onDismiss={onDismiss}
      footnote="AI-generated suggestions for this demo are based on sample data and are not saved."
    >
      {generating && <div className={styles.shimmer} aria-hidden="true" />}
      {phase === 'thinking' ? (
        <div className={styles.thinking}>
          <Spinner size="medium" />
          <Text>Prioritizing what matters most…</Text>
        </div>
      ) : (
        <>
          <Text size={300} className={styles.headline} block>
            {plan.headline}
          </Text>
          <div className={styles.list}>
            {plan.items.slice(0, revealed).map((item: IFocusItem, index: number) => (
              <div key={item.id} className={mergeClasses(styles.item, styles.itemEnter)}>
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
