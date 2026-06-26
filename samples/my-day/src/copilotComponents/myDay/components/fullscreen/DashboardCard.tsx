import * as React from 'react';

import { makeStyles, mergeClasses, tokens, Text } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '16px',
    borderRadius: tokens.borderRadiusXLarge,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow2
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    minWidth: 0
  },
  titleWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    flexGrow: 1,
    minWidth: 0
  },
  icon: {
    flexShrink: 0,
    display: 'inline-flex',
    color: tokens.colorNeutralForeground2
  },
  title: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  action: {
    flexShrink: 0,
    border: 'none',
    backgroundColor: 'transparent',
    padding: '2px 4px',
    color: tokens.colorBrandForegroundLink,
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    borderRadius: tokens.borderRadiusMedium,
    ':hover': {
      textDecorationLine: 'underline'
    }
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0
  }
});

export interface IDashboardCardProps {
  title: string;
  icon?: React.ReactElement;
  /** Optional trailing link (e.g. "View all"). No-op in the mock. */
  action?: { label: string; onClick?: () => void };
  className?: string;
  children: React.ReactNode;
}

/** Consistent card chrome for the full-screen dashboard panels. */
const DashboardCard: React.FunctionComponent<IDashboardCardProps> = (props) => {
  const styles = useStyles();
  const { title, icon, action, className, children } = props;

  return (
    <section className={mergeClasses(styles.root, className)}>
      <div className={styles.header}>
        <span className={styles.titleWrap}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <Text size={400} className={styles.title}>
            {title}
          </Text>
        </span>
        {action && (
          <button type="button" className={styles.action} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  );
};

export default DashboardCard;
