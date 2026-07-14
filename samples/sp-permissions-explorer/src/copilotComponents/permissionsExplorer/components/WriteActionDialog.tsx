import * as React from 'react';
import {
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner,
  makeStyles,
  tokens,
  type MessageBarIntent
} from '@fluentui/react-components';

import type {
  IPendingWriteAction,
  IRoleDefinitionInfo,
  IWriteActionResult,
  PermissionOperation
} from '../models/IWriteAction';

export interface IWriteActionDialogProps {
  action?: IPendingWriteAction;
  roleDefinitions: IRoleDefinitionInfo[];
  onExecute: (action: IPendingWriteAction) => Promise<IWriteActionResult>;
  onClose: () => void;
}

type DialogPhase = 'confirm' | 'running' | 'done';

const useStyles = makeStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM
  },
  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium
  },
  previewRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  label: {
    color: tokens.colorNeutralForeground3,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS
  }
});

function titleFor(op: PermissionOperation | undefined): string {
  switch (op) {
    case 'grantAccess': return 'Grant access';
    case 'removeAccess': return 'Remove access';
    case 'changePermissionLevel': return 'Change permission level';
    case 'addToSharePointGroup': return 'Add group member';
    case 'removeFromSharePointGroup': return 'Remove group member';
    default: return 'Confirm action';
  }
}

function firstNonHiddenRole(defs: IRoleDefinitionInfo[]): string {
  for (const d of defs) {
    if (!d.hidden) return d.name;
  }
  return defs.length > 0 ? defs[0].name : '';
}

function buildPreview(
  action: IPendingWriteAction,
  loginName: string,
  toRoleName: string
): { before: string; after: string } {
  const entry = action.entry;
  const member = action.member;
  switch (action.operation) {
    case 'grantAccess':
      return {
        before: `${loginName || 'The selected user'} has no direct access`,
        after: `Will have "${toRoleName}"`
      };
    case 'removeAccess':
      return {
        before: entry
          ? `${entry.displayName}: ${entry.permissionLevels.join(', ') || '(no levels)'}`
          : 'Selected principal',
        after: entry
          ? `${entry.displayName}: no direct access`
          : 'No direct access'
      };
    case 'changePermissionLevel':
      return {
        before: entry
          ? `${entry.displayName}: ${action.fromRoleName ?? ''}`
          : 'Selected principal',
        after: entry
          ? `${entry.displayName}: ${toRoleName}`
          : toRoleName
      };
    case 'addToSharePointGroup':
      return {
        before: entry ? `${entry.displayName} members` : 'Group members',
        after: `+ ${loginName || '(name required)'}`
      };
    case 'removeFromSharePointGroup':
      return {
        before: member && entry
          ? `${member.displayName} is a member of ${entry.displayName}`
          : 'Selected member',
        after: member && entry
          ? `${member.displayName} removed from ${entry.displayName}`
          : 'Member removed'
      };
    default:
      return { before: '', after: '' };
  }
}

function resultIntent(status: IWriteActionResult['status']): MessageBarIntent {
  if (status === 'success') return 'success';
  if (status === 'accessDenied') return 'warning';
  return 'error';
}

function resultTitle(status: IWriteActionResult['status']): string {
  if (status === 'success') return 'Change applied';
  if (status === 'accessDenied') return 'Access denied';
  return 'Change failed';
}

export const WriteActionDialog: React.FC<IWriteActionDialogProps> = (props) => {
  const { action, roleDefinitions, onExecute, onClose } = props;
  const styles = useStyles();

  const [phase, setPhase] = React.useState<DialogPhase>('confirm');
  const [result, setResult] = React.useState<IWriteActionResult | undefined>(undefined);
  const [loginName, setLoginName] = React.useState<string>('');
  const [toRoleName, setToRoleName] = React.useState<string>('');

  const loginInputRef = React.useRef<HTMLInputElement>(null);

  const roleDefinitionsRef = React.useRef<IRoleDefinitionInfo[]>(roleDefinitions);
  React.useEffect(() => {
    roleDefinitionsRef.current = roleDefinitions;
  }, [roleDefinitions]);

  React.useEffect(() => {
    if (!action) return;
    setPhase('confirm');
    setResult(undefined);
    setLoginName(action.loginName ?? '');
    const initialRole = action.toRoleName && action.toRoleName.length > 0
      ? action.toRoleName
      : firstNonHiddenRole(roleDefinitionsRef.current);
    setToRoleName(initialRole);
  }, [action]);

  const open = action !== undefined;
  const op = action?.operation;

  const needsLogin = op === 'grantAccess' || op === 'addToSharePointGroup';
  const needsRole = op === 'grantAccess' || op === 'changePermissionLevel';

  React.useEffect(() => {
    if (!open || phase !== 'confirm' || !needsLogin) return;
    const raf = requestAnimationFrame(() => {
      const el = loginInputRef.current;
      if (el) {
        el.focus();
        el.select();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [open, phase, needsLogin]);

  const canConfirm: boolean = React.useMemo(() => {
    if (!action) return false;
    if (needsLogin && loginName.trim().length === 0) return false;
    if (needsRole && toRoleName.trim().length === 0) return false;
    return true;
  }, [action, needsLogin, needsRole, loginName, toRoleName]);

  const preview = React.useMemo(() => {
    if (!action) return { before: '', after: '' };
    return buildPreview(action, loginName, toRoleName);
  }, [action, loginName, toRoleName]);

  const handleConfirm = React.useCallback(async (): Promise<void> => {
    if (!action) return;
    setPhase('running');
    const finalAction: IPendingWriteAction = {
      ...action,
      loginName: needsLogin ? loginName : action.loginName,
      toRoleName: needsRole ? toRoleName : action.toRoleName
    };
    try {
      const r = await onExecute(finalAction);
      setResult(r);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setResult({ status: 'error', message });
    }
    setPhase('done');
  }, [action, needsLogin, needsRole, loginName, toRoleName, onExecute]);

  const handleOpenChange = React.useCallback(
    (_event: unknown, data: { open: boolean }): void => {
      if (!data.open) onClose();
    },
    [onClose]
  );

  const nonHiddenRoles = React.useMemo(
    () => roleDefinitions.filter((d) => !d.hidden),
    [roleDefinitions]
  );

  const roleOptions = nonHiddenRoles.length > 0 ? nonHiddenRoles : roleDefinitions;

  return (
    <Dialog
      open={open}
      modalType="alert"
      onOpenChange={handleOpenChange}
    >
      <DialogSurface aria-label={titleFor(op)}>
        <DialogBody>
          <DialogTitle>{titleFor(op)}</DialogTitle>
          <DialogContent>
            <div className={styles.body}>
              {phase !== 'done' && (
                <>
                  <div className={styles.preview} aria-label="Change preview">
                    <div className={styles.previewRow}>
                      <Caption1 className={styles.label}>Before</Caption1>
                      <Body1>{preview.before}</Body1>
                    </div>
                    <div className={styles.previewRow}>
                      <Caption1 className={styles.label}>After</Caption1>
                      <Body1>{preview.after}</Body1>
                    </div>
                  </div>

                  {(needsLogin || needsRole) && (
                    <div className={styles.fields}>
                      {needsLogin && (
                        <Field label="User (login name, email, or UPN)" required>
                          <Input
                            ref={loginInputRef}
                            value={loginName}
                            onChange={(_e, data) => setLoginName(data.value)}
                            disabled={phase === 'running'}
                            aria-label="User login name, email, or UPN"
                          />
                        </Field>
                      )}
                      {op === 'changePermissionLevel' && (
                        <Field label="Current permission level">
                          <Input
                            value={action?.fromRoleName ?? ''}
                            readOnly
                            aria-label="Current permission level"
                          />
                        </Field>
                      )}
                      {needsRole && (
                        <Field label="New permission level" required>
                          <Dropdown
                            value={toRoleName}
                            selectedOptions={toRoleName ? [toRoleName] : []}
                            onOptionSelect={(_e, data) => {
                              if (typeof data.optionValue === 'string') {
                                setToRoleName(data.optionValue);
                              }
                            }}
                            disabled={phase === 'running'}
                            aria-label="New permission level"
                          >
                            {roleOptions.map((def) => (
                              <Option key={def.id} value={def.name}>
                                {def.name}
                              </Option>
                            ))}
                          </Dropdown>
                        </Field>
                      )}
                    </div>
                  )}
                </>
              )}

              {phase === 'running' && (
                <Spinner size="small" label="Applying change…" />
              )}

              {phase === 'done' && result && (
                <MessageBar intent={resultIntent(result.status)} politeness="polite">
                  <MessageBarBody>
                    <MessageBarTitle>{resultTitle(result.status)}</MessageBarTitle>
                    {result.message}
                  </MessageBarBody>
                </MessageBar>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            {phase === 'confirm' && (
              <>
                <Button appearance="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  disabled={!canConfirm}
                  onClick={() => { void handleConfirm(); }}
                >
                  Confirm
                </Button>
              </>
            )}
            {phase === 'running' && (
              <>
                <Button appearance="secondary" disabled>
                  Cancel
                </Button>
                <Button appearance="primary" disabled>
                  Applying…
                </Button>
              </>
            )}
            {phase === 'done' && (
              <Button appearance="primary" onClick={onClose}>
                Close
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default WriteActionDialog;
