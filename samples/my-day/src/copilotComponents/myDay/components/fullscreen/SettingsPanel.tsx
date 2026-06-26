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

import RightPanel from './RightPanel';

const PANELS = [
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
    gap: '12px'
  }
});

export interface ISettingsPanelProps {
  onDismiss: () => void;
}

/**
 * Settings drawer — **showcase only**. The controls are interactive but their
 * values are never persisted or applied; they illustrate where real preferences
 * (units, visible panels, location) would live.
 */
const SettingsPanel: React.FunctionComponent<ISettingsPanelProps> = ({ onDismiss }) => {
  const styles = useStyles();

  const [useFahrenheit, setUseFahrenheit] = React.useState(false);
  const [visible, setVisible] = React.useState<ReadonlySet<string>>(
    () => new Set(PANELS.map((p) => p.id))
  );
  const [city, setCity] = React.useState('Redmond');
  const [country, setCountry] = React.useState('United States');

  const togglePanel = (id: string): void => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <RightPanel
      title="Settings"
      icon={<Settings20Regular />}
      onDismiss={onDismiss}
      footnote="Settings are not saved in this demo."
    >
      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Temperature unit</Text>
        <Switch
          checked={useFahrenheit}
          label={useFahrenheit ? 'Fahrenheit (°F)' : 'Celsius (°C)'}
          onChange={(_, d) => setUseFahrenheit(!!d.checked)}
        />
      </div>

      <Divider className={styles.divider} />

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Visible panels</Text>
        <div className={styles.panelList}>
          {PANELS.map((p) => (
            <Checkbox
              key={p.id}
              label={p.label}
              checked={visible.has(p.id)}
              onChange={() => togglePanel(p.id)}
            />
          ))}
        </div>
      </div>

      <Divider className={styles.divider} />

      <div className={styles.section}>
        <Text className={styles.sectionTitle}>Location</Text>
        <div className={styles.row}>
          <Field label="City" style={{ flexGrow: 1 }}>
            <Input value={city} onChange={(_, d) => setCity(d.value)} />
          </Field>
          <Field label="Country" style={{ flexGrow: 1 }}>
            <Input value={country} onChange={(_, d) => setCountry(d.value)} />
          </Field>
        </div>
      </div>
    </RightPanel>
  );
};

export default SettingsPanel;
