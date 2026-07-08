import * as React from 'react';
import {
  Avatar,
  Button,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Settings20Regular, Sparkle20Filled } from '@fluentui/react-icons';

import type { ICurrentUser } from '../../models/dashboard';

export interface IDashboardHeaderProps {
  title: string;
  brandName: string;
  currentUser: ICurrentUser | undefined;
  settingsTitle: string;
  onOpenSettings: () => void;
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    paddingBottom: tokens.spacingVerticalS,
    borderBottomWidth: tokens.strokeWidthThin,
    borderBottomStyle: 'solid',
    borderBottomColor: tokens.colorNeutralStroke2
  },
  brand: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForeground1
  },
  chevron: {
    color: tokens.colorNeutralForeground4
  },
  spacer: {
    marginLeft: 'auto'
  },
  actions: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS
  }
});

/** Full-screen header: brand, dashboard title, current user and settings gear. */
export default function DashboardHeader(props: IDashboardHeaderProps): React.ReactElement {
  const { title, brandName, currentUser, settingsTitle, onOpenSettings } = props;
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <span className={styles.brand}>
        <Sparkle20Filled aria-hidden />
        <Text weight="semibold">{brandName}</Text>
      </span>
      <Text className={styles.chevron}>/</Text>
      <Text weight="semibold">{title}</Text>

      <span className={styles.spacer} />
      <div className={styles.actions}>
        {currentUser ? (
          <Avatar
            name={currentUser.displayName}
            initials={currentUser.initials}
            image={currentUser.photoUrl ? { src: currentUser.photoUrl } : undefined}
            size={28}
          />
        ) : undefined}
        <Button
          appearance="subtle"
          icon={<Settings20Regular />}
          title={settingsTitle}
          aria-label={settingsTitle}
          onClick={onOpenSettings}
        />
      </div>
    </div>
  );
}
