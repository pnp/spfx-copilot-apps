import * as React from 'react';
import {
  OverlayDrawer,
  DrawerHeader,
  DrawerHeaderTitle,
  DrawerBody,
  Button,
  Switch,
  Input,
  Field,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Dismiss20Regular } from '@fluentui/react-icons';

import type { IExecDashboardSettings } from '../../utils/settings';
import type { IExecDashboardStrings } from '../IExecDashboardProps';

export interface ISettingsPanelProps {
  open: boolean;
  settings: IExecDashboardSettings;
  strings: IExecDashboardStrings;
  onSettingsChange: (settings: IExecDashboardSettings) => void;
  onClose: () => void;
}

const useStyles = makeStyles({
  body: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    paddingTop: tokens.spacingVerticalM
  }
});

/** Settings drawer opened from the full-screen gear icon. */
export default function SettingsPanel(props: ISettingsPanelProps): React.ReactElement {
  const { open, settings, strings, onSettingsChange, onClose } = props;
  const styles = useStyles();

  const urlMissing: boolean = !settings.useMock && settings.dataServiceUrl.trim().length === 0;

  return (
    <OverlayDrawer open={open} position="end" onOpenChange={(_e, data) => { if (!data.open) { onClose(); } }}>
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              icon={<Dismiss20Regular />}
              aria-label={strings.CloseTitle}
              onClick={onClose}
            />
          }
        >
          {strings.SettingsHeading}
        </DrawerHeaderTitle>
      </DrawerHeader>
      <DrawerBody>
        <div className={styles.body}>
          <Field label={strings.UseMockLabel} hint={strings.UseMockHint}>
            <Switch
              checked={settings.useMock}
              onChange={(_e, data) => onSettingsChange({ ...settings, useMock: data.checked })}
            />
          </Field>

          {!settings.useMock && (
            <Field
              label={strings.DataServiceUrlLabel}
              required
              validationState={urlMissing ? 'error' : 'none'}
              validationMessage={urlMissing ? strings.DataServiceUrlRequired : undefined}
            >
              <Input
                type="url"
                placeholder={strings.DataServiceUrlPlaceholder}
                value={settings.dataServiceUrl}
                onChange={(_e, data) => onSettingsChange({ ...settings, dataServiceUrl: data.value })}
              />
            </Field>
          )}
        </div>
      </DrawerBody>
    </OverlayDrawer>
  );
}
