import * as React from 'react';
import {
  Body1,
  Button,
  Caption1,
  Card,
  Radio,
  RadioGroup,
  Title3,
  makeStyles,
  tokens,
  type RadioGroupOnChangeData
} from '@fluentui/react-components';

import type { IResolvedSite } from '../models/IResolvedSite';

export interface ISitePickerProps {
  sites: IResolvedSite[];
  onSelect: (site: IResolvedSite) => void;
}

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM
  },
  option: {
    display: 'flex',
    flexDirection: 'column'
  },
  url: {
    color: tokens.colorNeutralForeground3
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end'
  }
});

export const SitePicker: React.FC<ISitePickerProps> = ({ sites, onSelect }) => {
  const styles = useStyles();
  const [selectedUrl, setSelectedUrl] = React.useState<string>(sites[0]?.webUrl ?? '');

  const handleChange = React.useCallback(
    (_ev: React.FormEvent<HTMLDivElement>, data: RadioGroupOnChangeData): void => {
      setSelectedUrl(data.value);
    },
    []
  );

  const handleConfirm = React.useCallback((): void => {
    const picked = sites.find((s) => s.webUrl === selectedUrl);
    if (picked) onSelect(picked);
  }, [sites, selectedUrl, onSelect]);

  return (
    <Card className={styles.card} aria-label="Multiple sites found">
      <Title3>Multiple sites found</Title3>
      <Caption1>Select the site you want to review.</Caption1>
      <RadioGroup value={selectedUrl} onChange={handleChange}>
        {sites.map((site) => (
          <Radio
            key={site.webUrl}
            value={site.webUrl}
            label={
              <span className={styles.option}>
                <Body1>{site.title}</Body1>
                <Caption1 className={styles.url}>{site.webUrl}</Caption1>
              </span>
            }
          />
        ))}
      </RadioGroup>
      <div className={styles.footer}>
        <Button appearance="primary" onClick={handleConfirm} disabled={!selectedUrl}>
          Review this site
        </Button>
      </div>
    </Card>
  );
};

export default SitePicker;
