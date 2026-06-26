import * as React from 'react';

import { Button, makeStyles, tokens, Text } from '@fluentui/react-components';
import { Dismiss20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    flexShrink: 0,
    alignSelf: 'stretch',
    width: '380px',
    maxWidth: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    backgroundColor: tokens.colorNeutralBackground1,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    boxShadow: tokens.shadow28,
    animationDuration: tokens.durationGentle,
    animationName: {
      from: { transform: 'translateX(24px)', opacity: 0 },
      to: { transform: 'translateX(0)', opacity: 1 }
    }
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxSizing: 'border-box',
    padding: '16px 16px 12px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`
  },
  headerText: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    flexGrow: 1,
    minWidth: 0
  },
  headerIcon: {
    flexShrink: 0,
    display: 'inline-flex',
    color: tokens.colorBrandForeground1
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  body: {
    flexGrow: 1,
    minHeight: 0,
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '16px'
  },
  footnote: {
    boxSizing: 'border-box',
    padding: '10px 16px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground3
  }
});

export interface IRightPanelProps {
  title: string;
  icon?: React.ReactElement;
  onDismiss: () => void;
  /** Small muted line pinned to the bottom (e.g. a disclaimer). */
  footnote?: string;
  children: React.ReactNode;
}

/**
 * Shared right-side drawer shell used by both the "Plan my day" and Settings
 * panels. Renders as a sibling column so the dashboard yields the remaining
 * width while it is open (only one is mounted at a time).
 */
const RightPanel: React.FunctionComponent<IRightPanelProps> = (props) => {
  const styles = useStyles();
  const { title, icon, onDismiss, footnote, children } = props;

  return (
    <aside className={styles.root} role="complementary" aria-label={title}>
      <div className={styles.header}>
        <span className={styles.headerText}>
          {icon && <span className={styles.headerIcon}>{icon}</span>}
          <Text size={400} className={styles.title}>
            {title}
          </Text>
        </span>
        <Button
          appearance="subtle"
          size="small"
          icon={<Dismiss20Regular />}
          aria-label="Close panel"
          onClick={onDismiss}
        />
      </div>
      <div className={styles.body}>{children}</div>
      {footnote && (
        <Text size={200} className={styles.footnote}>
          {footnote}
        </Text>
      )}
    </aside>
  );
};

export default RightPanel;
