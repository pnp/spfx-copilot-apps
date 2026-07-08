import * as React from 'react';
import { Caption1, Link, makeStyles, tokens } from '@fluentui/react-components';
import { Sparkle16Regular } from '@fluentui/react-icons';

export interface IDashboardFooterProps {
  disclaimer: string;
  poweredBy: string;
  giveFeedback: string;
  /** Invoked when the user selects "Give feedback". */
  onGiveFeedback: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXS,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalXS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderTopWidth: tokens.strokeWidthThin,
    borderTopStyle: 'solid',
    borderTopColor: tokens.colorNeutralStroke2
  },
  disclaimer: {
    color: tokens.colorNeutralForeground3
  },
  spacer: {
    marginLeft: 'auto'
  },
  poweredBy: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
    color: tokens.colorNeutralForeground3
  }
});

/**
 * Static dashboard footer shown in both inline and full-screen experiences:
 * an AI disclaimer, a "powered by" attribution, and a feedback link.
 */
export default function DashboardFooter(props: IDashboardFooterProps): React.ReactElement {
  const { disclaimer, poweredBy, giveFeedback, onGiveFeedback } = props;
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <Caption1 className={styles.disclaimer}>{disclaimer}</Caption1>
      <span className={styles.spacer} />
      <Caption1 className={styles.poweredBy}>
        <Sparkle16Regular aria-hidden />
        {poweredBy}
      </Caption1>
      <Link as="button" appearance="subtle" onClick={onGiveFeedback}>
        {giveFeedback}
      </Link>
    </div>
  );
}
