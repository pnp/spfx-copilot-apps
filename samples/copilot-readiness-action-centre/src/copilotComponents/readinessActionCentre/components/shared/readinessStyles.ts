import { makeStyles, tokens } from '@fluentui/react-components';

export const useReadinessStyles = makeStyles({
  root: {
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground1,
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100%',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box'
  },
  rootWide: {
    fontFamily: tokens.fontFamilyBase,
    color: tokens.colorNeutralForeground1,
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground1,
    minHeight: '100%',
    width: '100%',
    minWidth: 0,
    boxSizing: 'border-box',
    maxWidth: '1280px',
    marginLeft: 'auto',
    marginRight: 'auto',
    '@media (min-width: 1728px)': {
      maxWidth: '1440px'
    },
    '@media (min-width: 2160px)': {
      maxWidth: '1680px'
    }
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  greeting: {
    color: tokens.colorNeutralForeground3,
    marginBottom: '4px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  gridWide: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  kpi: {
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2
  },
  findings: {
    display: 'grid',
    gap: '10px'
  },
  finding: {
    padding: '14px',
    cursor: 'pointer',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2,
    ':hover': {
      boxShadow: tokens.shadow8
    }
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    alignItems: 'center'
  },
  muted: {
    color: tokens.colorNeutralForeground3
  },
  bar: {
    marginTop: '8px'
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(260px, 1fr)',
    gap: '16px',
    '@media (max-width: 720px)': {
      gridTemplateColumns: '1fr'
    }
  },
  panel: {
    padding: '16px',
    borderRadius: tokens.borderRadiusMedium,
    boxShadow: tokens.shadow2
  },
  resources: {
    display: 'grid',
    gap: '8px',
    marginTop: '12px'
  },
  resource: {
    padding: '10px',
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium
  },
  actions: {
    display: 'grid',
    gap: '12px'
  },
  error: {
    padding: '12px',
    backgroundColor: tokens.colorPaletteRedBackground1,
    color: tokens.colorPaletteRedForeground1,
    borderRadius: tokens.borderRadiusMedium
  },
  success: {
    padding: '12px',
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
    borderRadius: tokens.borderRadiusMedium
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '32px',
    minHeight: '200px'
  },
  empty: {
    padding: '16px',
    color: tokens.colorNeutralForeground3
  }
});
