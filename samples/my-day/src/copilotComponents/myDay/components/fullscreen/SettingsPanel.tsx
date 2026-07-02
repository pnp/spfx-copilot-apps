import * as React from 'react';

import {
  Checkbox,
  Divider,
  Field,
  Input,
  makeStyles,
  Switch,
  tokens,
  Text
} from '@fluentui/react-components';
import { Settings20Regular } from '@fluentui/react-icons';

import type { IMyDaySettings, PanelId } from '../../utils/settings';
import RightPanel from './RightPanel';

const PANELS: { id: PanelId; label: string }[] = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'mail', label: 'Important mail' },
  { id: 'news', label: 'News' },
  { id: 'quickActions', label: 'Quick actions' },
  { id: 'planMyDay', label: 'Plan my day' }
];

const useStyles = makeStyles({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  sectionTitle: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground2
  },
  panelList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  divider: {
    marginTop: '16px',
    marginBottom: '16px'
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  }
});

export interface ISettingsPanelProps {
  /** Current session-backed settings. */
  settings: IMyDaySettings;
  /** Applies a partial update to the session-backed settings. */
  onChange: (patch: Partial<IMyDaySettings>) => void;
  onDismiss: () => void;
}

/**
 * Settings drawer. In this demo the settings are **intentionally** persisted to
 * the browser session (sessionStorage) rather than to a server, so changes are
 * remembered for the current session only. The temperature unit is applied live
 * to the full-screen weather card; the remaining controls are illustrative.
 */
const SettingsPanel: React.FunctionComponent<ISettingsPanelProps> = ({
  settings,
  onChange,
  onDismiss
}) => {
  const styles = useStyles();

  const visible = React.useMemo(
    () => new Set<PanelId>(settings.visiblePanels),
    [settings.visiblePanels]
  );

  const togglePanel = (id: PanelId): void => {
    const next = new Set(visible);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange({ visiblePanels: PANELS.map((p) => p.id).filter((pid) => next.has(pid)) });
  };

  return (
    <RightPanel
      title="Settings"
      icon={<Settings20Regular />}
      onDismiss={onDismiss}
      footnote="Stored in this browser session only — not saved permanently."
    >
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Temperature unit</Text>
        <Switch
          checked={settings.useFahrenheit}
          label={settings.useFahrenheit ? 'Fahrenheit (°F)' : 'Celsius (°C)'}
          onChange={(_, d) => onChange({ useFahrenheit: !!d.checked })}
        />
      </div>

      <Divider className={styles.divider} />

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Visible panels</Text>
        <div className={styles.panelList}>
          {PANELS.map((p) => {
            const isChecked = visible.has(p.id);
            // Keep at least one panel visible so the dashboard is never empty.
            const isLastVisible = isChecked && visible.size === 1;
            return (
              <Checkbox
                key={p.id}
                label={p.label}
                checked={isChecked}
                disabled={isLastVisible}
                onChange={() => togglePanel(p.id)}
              />
            );
          })}
        </div>
      </div>

      <Divider className={styles.divider} />

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Location</Text>
        <div className={styles.row}>
          <Field label="City" style={{ flexGrow: 1 }}>
            <Input value={settings.city} onChange={(_, d) => onChange({ city: d.value })} />
          </Field>
          <Field label="Country" style={{ flexGrow: 1 }}>
            <Input value={settings.country} onChange={(_, d) => onChange({ country: d.value })} />
          </Field>
        </div>
      </div>
    </RightPanel>
  );
};

export default SettingsPanel;
