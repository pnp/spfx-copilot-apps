import * as React from 'react';

import { makeStyles, mergeClasses, shorthands, tokens, Text } from '@fluentui/react-components';
import { ChevronRight20Regular } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    boxSizing: 'border-box',
    minWidth: 0,
    padding: '14px',
    textAlign: 'left',
    cursor: 'pointer',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    boxShadow: tokens.shadow2,
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color, border-color, box-shadow',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      ...shorthands.borderColor(tokens.colorNeutralStroke1),
      boxShadow: tokens.shadow8
    },
    ':active': {
      backgroundColor: tokens.colorNeutralBackground1Pressed,
      boxShadow: tokens.shadow4
    }
  },
  static: {
    cursor: 'default',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1,
      ...shorthands.borderColor(tokens.colorNeutralStroke2),
      boxShadow: tokens.shadow2
    }
  },
  icon: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: tokens.borderRadiusCircular,
    fontSize: '20px'
  },
  body: {
    flexGrow: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  title: {
    color: tokens.colorNeutralForeground3
  },
  primary: {
    fontWeight: tokens.fontWeightSemibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  secondary: {
    color: tokens.colorNeutralForeground3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  chevron: {
    flexShrink: 0,
    color: tokens.colorNeutralForeground3
  }
});

/** Accent palettes for the leading icon badge. */
export type TileAccent = 'meeting' | 'tasks' | 'news';

const useAccentStyles = makeStyles({
  meeting: {
    backgroundColor: tokens.colorPaletteBlueBackground2,
    color: tokens.colorPaletteBlueForeground2
  },
  tasks: {
    backgroundColor: tokens.colorPaletteGreenBackground2,
    color: tokens.colorPaletteGreenForeground2
  },
  news: {
    backgroundColor: tokens.colorPaletteBerryBackground2,
    color: tokens.colorPaletteBerryForeground2
  }
});

export interface ISummaryTileProps {
  icon: React.ReactElement;
  accent: TileAccent;
  title: string;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  /** When provided, the tile is interactive and shows a chevron. */
  onClick?: () => void;
}

/**
 * Reusable navigable summary tile: leading accent icon, title + primary +
 * secondary text, and a trailing chevron when interactive.
 */
const SummaryTile: React.FunctionComponent<ISummaryTileProps> = (props) => {
  const styles = useStyles();
  const accents = useAccentStyles();
  const { icon, accent, title, primary, secondary, onClick } = props;

  const interactive = typeof onClick === 'function';
  const content = (
    <>
      <span className={mergeClasses(styles.icon, accents[accent])}>{icon}</span>
      <span className={styles.body}>
        <Text size={200} className={styles.title}>
          {title}
        </Text>
        <Text size={300} className={styles.primary}>
          {primary}
        </Text>
        {secondary !== undefined && (
          <Text size={200} className={styles.secondary}>
            {secondary}
          </Text>
        )}
      </span>
      {interactive && <ChevronRight20Regular className={styles.chevron} />}
    </>
  );

  if (!interactive) {
    return <div className={mergeClasses(styles.root, styles.static)}>{content}</div>;
  }

  return (
    <button type="button" className={styles.root} onClick={onClick}>
      {content}
    </button>
  );
};

export default SummaryTile;
