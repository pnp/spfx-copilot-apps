import * as React from 'react';
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { DismissRegular } from '@fluentui/react-icons';

import type { IPermissionEntry } from '../models/IPermissionEntry';

export interface IPrincipalDetailsPanelProps {
  entry?: IPermissionEntry;
  open: boolean;
  onClose: () => void;
}

const useStyles = makeStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  label: {
    color: tokens.colorNeutralForeground3
  },
  levelList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalXS
  },
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    margin: 0,
    paddingLeft: tokens.spacingHorizontalM
  }
});

interface IFieldProps {
  label: string;
  children: React.ReactNode;
}

const Field: React.FC<IFieldProps> = ({ label, children }) => {
  const styles = useStyles();
  return (
    <div className={styles.field}>
      <Caption1 className={styles.label}>{label}</Caption1>
      <div>{children}</div>
    </div>
  );
};

export const PrincipalDetailsPanel: React.FC<IPrincipalDetailsPanelProps> = ({
  entry,
  open,
  onClose
}) => {
  const styles = useStyles();

  return (
    <Drawer
      type="overlay"
      position="end"
      open={open && entry !== undefined}
      onOpenChange={(_ev, data) => {
        if (!data.open) onClose();
      }}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close details"
              icon={<DismissRegular />}
              onClick={onClose}
            />
          }
        >
          {entry?.displayName ?? ''}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        {entry && (
          <div className={styles.body}>
            <Field label="Principal type">
              <Body1>{entry.principalType}</Body1>
            </Field>
            <Field label="Source">
              <Badge appearance="tint">{entry.source}</Badge>
            </Field>
            <Field label="Permission levels">
              {entry.permissionLevels.length === 0 ? (
                <Caption1>None granted directly</Caption1>
              ) : (
                <div className={styles.levelList}>
                  {entry.permissionLevels.map((level) => (
                    <Badge key={level} appearance="outline">
                      {level}
                    </Badge>
                  ))}
                </div>
              )}
            </Field>
            <Field label="Login name">
              <Body1>{entry.loginName ?? '—'}</Body1>
            </Field>
            <Field label="Email">
              <Body1>{entry.email ?? '—'}</Body1>
            </Field>
            <Field label="External">
              <Body1>{entry.isExternal === true ? 'Yes' : 'No'}</Body1>
            </Field>
            <Field label="Group expandable">
              <Body1>{entry.isGroupExpandable === true ? 'Yes' : 'No'}</Body1>
            </Field>
            {entry.groupMembers && entry.groupMembers.length > 0 && (
              <Field label="Group members">
                <ul className={styles.memberList}>
                  {entry.groupMembers.map((member) => (
                    <li key={member.id}>
                      <Body1>{member.displayName}</Body1>{' '}
                      <Badge appearance="tint" size="small">
                        {member.principalType}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Field>
            )}
          </div>
        )}
      </DrawerBody>
    </Drawer>
  );
};

export default PrincipalDetailsPanel;
