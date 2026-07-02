import * as React from 'react';
import { Clock16Regular } from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';

export interface IDashboardFooterProps {
  asOfLabel?: string;
}

/**
 * Static compliance footer shown across the experiences.
 */
export default function DashboardFooter(props: IDashboardFooterProps): React.ReactElement {
  const styles = useZavaStyles();

  return (
    <div className={styles.footer}>
      <span>AI-generated content may be incorrect</span>
      <span>Powered by Microsoft 365 and Work IQ</span>
      <div className={styles.footerMeta}>
        {props.asOfLabel ? (
          <span className={styles.footerMeta}>
            <Clock16Regular />
            {props.asOfLabel}
          </span>
        ) : undefined}
        <span className={styles.linkText}>Give feedback</span>
      </div>
    </div>
  );
}
