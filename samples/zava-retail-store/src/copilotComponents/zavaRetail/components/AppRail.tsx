import * as React from 'react';
import {
  Home24Regular,
  DataBarVertical24Regular,
  People24Regular,
  Box24Regular,
  Location24Regular,
  Document24Regular,
  Alert24Regular,
  Settings24Regular,
  QuestionCircle24Regular
} from '@fluentui/react-icons';
import { useZavaStyles } from './useZavaStyles';

interface IRailEntry {
  key: string;
  label: string;
  icon: React.ReactElement;
  active?: boolean;
}

const PRIMARY_ITEMS: IRailEntry[] = [
  { key: 'overview', label: 'Overview', icon: <Home24Regular />, active: true },
  { key: 'sales', label: 'Sales', icon: <DataBarVertical24Regular /> },
  { key: 'customers', label: 'Customers', icon: <People24Regular /> },
  { key: 'products', label: 'Products', icon: <Box24Regular /> },
  { key: 'stores', label: 'Stores', icon: <Location24Regular /> },
  { key: 'reports', label: 'Reports', icon: <Document24Regular /> },
  { key: 'alerts', label: 'Alerts', icon: <Alert24Regular /> }
];

export interface IAppRailProps {
  onOpenSettings: () => void;
}

/**
 * Left navigation rail for the full-screen dashboard.
 */
export default function AppRail(props: IAppRailProps): React.ReactElement {
  const styles = useZavaStyles();

  return (
    <nav className={styles.appRail} aria-label="Dashboard navigation">
      <span className={styles.railBrand} />
      {PRIMARY_ITEMS.map((item) => (
        <div key={item.key} className={`${styles.railItem} ${item.active ? styles.railItemActive : ''}`}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      ))}
      <span className={styles.railSpacer} />
      <div className={styles.railItem} onClick={props.onOpenSettings} role="button" tabIndex={0}>
        <Settings24Regular />
        <span>Settings</span>
      </div>
      <div className={styles.railItem}>
        <QuestionCircle24Regular />
        <span>Help</span>
      </div>
    </nav>
  );
}
