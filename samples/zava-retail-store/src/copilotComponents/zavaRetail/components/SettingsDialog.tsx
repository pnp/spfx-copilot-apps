import * as React from 'react';
import {
  Button,
  Input,
  Label,
  mergeClasses,
  Radio,
  RadioGroup,
  Switch
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';
import type { ISettingsDialogProps } from './IComponentProps';

/**
 * Settings panel for toggling mock data, configuring the data service URL and theme.
 *
 * Rendered as a self-contained side panel that slides in from the right edge of the
 * dashboard. It is non-modal: the main component keeps rendering and stays visible
 * while settings are adjusted, with no full-screen overlay.
 */
export default function SettingsDialog(props: ISettingsDialogProps): React.ReactElement {
  const styles = useZavaStyles();

  return (
    <aside
      className={mergeClasses(styles.settingsPanel, props.open && styles.settingsPanelOpen)}
      aria-hidden={!props.open}
      aria-label="Dashboard settings"
    >
      <div className={styles.settingsPanelHeader}>
        <span className={styles.settingsPanelTitle}>Dashboard settings</span>
        <Button
          appearance="subtle"
          aria-label="Close settings"
          icon={<Dismiss24Regular />}
          onClick={() => props.onOpenChange(false)}
        />
      </div>
      <div className={styles.settingsPanelBody}>
        <div className={styles.settingsForm}>
          <Switch
            label="Use mock data"
            checked={props.useMock}
            onChange={(_, data) => props.onUseMockChange(Boolean(data.checked))}
          />
          {props.dataError ? (
            <div className={styles.settingsError} role="alert">
              {props.dataError}
            </div>
          ) : undefined}
          <div className={styles.settingsField}>
            <Label htmlFor="data-service-url">Data service URL</Label>
            <Input
              id="data-service-url"
              value={props.dataServiceUrl}
              onChange={(_, data) => props.onDataServiceUrlChange(data.value)}
              disabled={props.useMock}
              placeholder="https://zava.example/api/retail"
            />
          </div>
          <div className={styles.settingsField}>
            <Label htmlFor="theme-mode">Theme</Label>
            <RadioGroup
              id="theme-mode"
              layout="horizontal"
              value={props.theme}
              onChange={(_, data) => {
                if (data.value === 'light' || data.value === 'dark') {
                  props.onThemeChange(data.value);
                }
              }}
            >
              <Radio value="light" label="Light" />
              <Radio value="dark" label="Dark" />
            </RadioGroup>
          </div>
          <div className={styles.settingsActions}>
            <Button appearance="primary" onClick={() => props.onOpenChange(false)}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
