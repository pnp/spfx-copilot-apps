import { makeStyles, shorthands } from '@fluentui/react-components';
import { palette, themeColors } from './palette';

/**
 * Centralized Griffel styles shared by every Zava Retail sub-component so the inline
 * and full-screen experiences stay pixel-consistent with the reference design.
 */
export const useZavaStyles = makeStyles({
  /* ---------- Root shell ---------- */
  root: {
    ...themeColors.light,
    minHeight: '560px',
    height: '100%',
    backgroundColor: palette.pageBg,
    color: palette.ink,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Segoe UI', Tahoma, sans-serif",
    ...shorthands.borderRadius('14px'),
    ...shorthands.overflow('hidden')
  },
  rootDark: {
    ...themeColors.dark
  },
  loadingContainer: {
    minHeight: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  errorCard: {
    ...shorthands.margin('16px')
  },

  /* ---------- Inline experience ---------- */
  inlineFrame: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('10px'),
    height: '100%',
    ...shorthands.padding('12px', '14px'),
    backgroundColor: palette.surface
  },
  inlineHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  copilotBrand: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    fontWeight: 600,
    fontSize: '13px'
  },
  brandMark: {
    width: '18px',
    height: '18px',
    ...shorthands.borderRadius('5px'),
    backgroundImage: 'conic-gradient(from 180deg, #4f46e5, #06b6d4, #8b5cf6, #4f46e5)'
  },
  inlineHeaderActions: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('2px'),
    color: palette.inkFaint
  },
  promptBubble: {
    alignSelf: 'flex-end',
    ...shorthands.padding('8px', '12px'),
    ...shorthands.borderRadius('14px', '14px', '4px', '14px'),
    backgroundColor: palette.borderSoft,
    maxWidth: '85%',
    fontSize: '12px',
    color: palette.ink,
    lineHeight: '1.4'
  },
  summaryLabel: {
    color: palette.inkMuted,
    fontSize: '12px'
  },
  inlineStoreCard: {
    ...shorthands.border('1px', 'solid', palette.border),
    ...shorthands.borderRadius('12px'),
    backgroundColor: palette.surface,
    ...shorthands.overflow('hidden'),
    position: 'relative'
  },
  skyline: {
    width: '100%',
    height: '108px',
    objectFit: 'cover',
    backgroundColor: palette.border,
    display: 'block'
  },
  skylineBadge: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    width: '34px',
    height: '34px',
    ...shorthands.borderRadius('50%'),
    backgroundColor: 'rgba(255,255,255,0.92)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: palette.brandStrong,
    boxShadow: '0 2px 6px rgba(0,0,0,0.18)'
  },
  inlineStoreMeta: {
    ...shorthands.padding('10px', '12px', '12px'),
    display: 'grid',
    ...shorthands.gap('2px')
  },
  inlineStoreName: {
    fontSize: '14px',
    fontWeight: 600,
    color: palette.inkStrong
  },
  inlineStoreSub: {
    fontSize: '11px',
    color: palette.inkMuted
  },
  inlineKpiCard: {
    ...shorthands.border('1px', 'solid', palette.border),
    ...shorthands.borderRadius('12px'),
    backgroundColor: palette.surface,
    ...shorthands.padding('10px', '12px'),
    display: 'grid',
    gridTemplateColumns: '34px 1fr',
    columnGap: '10px',
    alignItems: 'center'
  },
  inlineKpiIcon: {
    width: '34px',
    height: '34px',
    ...shorthands.borderRadius('9px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  kpiLabel: {
    fontSize: '10px',
    letterSpacing: '.05em',
    textTransform: 'uppercase',
    color: palette.inkFaint
  },
  kpiValue: {
    fontSize: '26px',
    fontWeight: 700,
    lineHeight: '1.05',
    color: palette.inkStrong
  },
  kpiSubline: {
    fontSize: '11px',
    color: palette.positive
  },
  inlineMiniTrend: {
    ...shorthands.border('1px', 'solid', palette.border),
    ...shorthands.borderRadius('12px'),
    backgroundColor: palette.surface,
    ...shorthands.padding('10px', '12px')
  },
  miniChart: {
    marginTop: '6px',
    height: '46px'
  },
  miniAxis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    fontSize: '9px',
    color: palette.inkFaint,
    marginTop: '2px',
    textAlign: 'center'
  },
  inlineActionButton: {
    width: '100%'
  },
  inlinePromptRow: {
    ...shorthands.border('1px', 'solid', palette.border),
    ...shorthands.borderRadius('999px'),
    backgroundColor: palette.surface,
    ...shorthands.padding('7px', '12px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
    fontSize: '12px',
    color: palette.inkFaint
  },
  inlinePromptIcons: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    color: palette.inkMuted
  },
  inlineFooter: {
    marginTop: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '11px',
    color: palette.inkFaint
  },
  inlineFooterThumbs: {
    display: 'flex',
    ...shorthands.gap('8px'),
    color: palette.inkFaint
  },

  /* ---------- Full-screen shell ---------- */
  fullScreenShell: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: '76px minmax(0, 1fr)',
    height: '100%',
    minHeight: '640px',
    backgroundColor: palette.pageBg,
    ...shorthands.overflow('hidden')
  },
  appRail: {
    backgroundColor: palette.surface,
    ...shorthands.borderRight('1px', 'solid', palette.borderSoft),
    ...shorthands.padding('12px', '6px'),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    ...shorthands.gap('4px')
  },
  railBrand: {
    width: '30px',
    height: '30px',
    ...shorthands.borderRadius('8px'),
    backgroundImage: 'conic-gradient(from 180deg, #4f46e5, #06b6d4, #8b5cf6, #4f46e5)',
    marginBottom: '8px'
  },
  railItem: {
    width: '100%',
    display: 'grid',
    justifyItems: 'center',
    ...shorthands.gap('3px'),
    color: palette.inkMuted,
    ...shorthands.padding('7px', '2px'),
    ...shorthands.borderRadius('8px'),
    fontSize: '9.5px',
    cursor: 'default'
  },
  railItemActive: {
    color: palette.brandStrong,
    backgroundColor: palette.brandSofter
  },
  railSpacer: {
    flex: 1
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    ...shorthands.gap('12px'),
    ...shorthands.padding('14px', '16px'),
    ...shorthands.overflow('auto')
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('10px')
  },
  topBarLeft: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('10px'),
    minWidth: 0
  },
  appTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: palette.inkStrong,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    ...shorthands.overflow('hidden')
  },
  topBarRight: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('8px')
  },
  topPill: {
    ...shorthands.border('1px', 'solid', palette.border),
    ...shorthands.borderRadius('8px'),
    backgroundColor: palette.surface,
    ...shorthands.padding('6px', '10px'),
    fontSize: '12px',
    color: palette.ink,
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px'),
    whiteSpace: 'nowrap'
  },
  avatar: {
    width: '32px',
    height: '32px',
    ...shorthands.borderRadius('999px'),
    backgroundColor: palette.brandStrong,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '12px',
    ...shorthands.overflow('hidden')
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },

  /* ---------- Metric cards ---------- */
  metricGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
    ...shorthands.gap('10px'),
    '@media (max-width: 1320px)': {
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))'
    }
  },
  metricCard: {
    ...shorthands.border('1px', 'solid', palette.borderSoft),
    ...shorthands.borderRadius('12px'),
    backgroundColor: palette.surface,
    ...shorthands.padding('12px'),
    display: 'grid',
    ...shorthands.gap('6px')
  },
  metricHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  metricIcon: {
    width: '30px',
    height: '30px',
    ...shorthands.borderRadius('8px'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  metricDelta: {
    fontSize: '11px',
    fontWeight: 600,
    color: palette.positive,
    backgroundColor: '#dcfce7',
    ...shorthands.borderRadius('999px'),
    ...shorthands.padding('2px', '7px')
  },
  metricLabel: {
    fontSize: '11px',
    color: palette.inkMuted
  },
  metricValue: {
    fontSize: '26px',
    lineHeight: '1.05',
    fontWeight: 700,
    color: palette.inkStrong
  },
  metricSpark: {
    width: '100%',
    height: '26px',
    marginTop: '2px'
  },

  /* ---------- Generic panels ---------- */
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr)',
    ...shorthands.gap('12px'),
    '@media (max-width: 1280px)': {
      gridTemplateColumns: '1fr'
    }
  },
  panelCard: {
    ...shorthands.border('1px', 'solid', palette.borderSoft),
    ...shorthands.borderRadius('14px'),
    backgroundColor: palette.surface,
    ...shorthands.padding('14px')
  },
  panelHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  panelTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: palette.inkStrong
  },
  panelSub: {
    fontSize: '11px',
    color: palette.inkMuted
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('14px'),
    fontSize: '11px',
    color: palette.inkMuted,
    marginBottom: '4px'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('5px')
  },
  legendSwatch: {
    width: '14px',
    height: '0',
    ...shorthands.borderTop('2px', 'solid', palette.brandStrong)
  },
  legendSwatchDashed: {
    width: '14px',
    height: '0',
    ...shorthands.borderTop('2px', 'dashed', palette.inkFaint)
  },
  chartCanvas: {
    width: '100%',
    height: '150px'
  },

  /* ---------- Category bars ---------- */
  categoryRow: {
    display: 'grid',
    gridTemplateColumns: '78px 1fr 50px',
    alignItems: 'center',
    ...shorthands.gap('8px'),
    marginBottom: '9px'
  },
  categoryLabel: {
    fontSize: '11px',
    color: palette.ink
  },
  categoryTrack: {
    height: '12px',
    ...shorthands.borderRadius('999px'),
    backgroundColor: palette.borderSoft
  },
  categoryBar: {
    display: 'block',
    height: '12px',
    ...shorthands.borderRadius('999px'),
    backgroundImage: 'linear-gradient(90deg, #4f46e5 0%, #818cf8 100%)'
  },
  categoryValue: {
    fontSize: '11px',
    color: palette.ink,
    textAlign: 'right',
    fontWeight: 600
  },
  categoryAxis: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: palette.inkFaint,
    marginLeft: '86px'
  },

  /* ---------- Satisfaction panel ---------- */
  satisfactionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    ...shorthands.gap('10px'),
    alignItems: 'center'
  },
  npsBlock: {
    display: 'grid',
    ...shorthands.gap('2px')
  },
  npsValue: {
    fontSize: '38px',
    lineHeight: '1',
    color: palette.positiveStrong,
    fontWeight: 700
  },
  npsDelta: {
    fontSize: '11px',
    color: palette.positive
  },
  sentimentWrap: {
    marginTop: '10px'
  },
  sentimentCanvas: {
    width: '100%',
    height: '70px'
  },

  /* ---------- Customer feedback ---------- */
  feedbackList: {
    display: 'grid',
    ...shorthands.gap('10px')
  },
  feedbackCard: {
    ...shorthands.border('1px', 'solid', palette.borderSoft),
    ...shorthands.borderRadius('10px'),
    ...shorthands.padding('10px')
  },
  feedbackHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px'
  },
  feedbackName: {
    fontSize: '12px',
    fontWeight: 600,
    color: palette.inkStrong
  },
  feedbackStars: {
    display: 'flex',
    ...shorthands.gap('1px'),
    color: '#f59e0b'
  },
  feedbackText: {
    fontSize: '11px',
    color: palette.inkMuted,
    lineHeight: '1.4'
  },
  feedbackMeta: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: '6px'
  },
  feedbackDate: {
    fontSize: '10px',
    color: palette.inkFaint
  },
  positiveBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: palette.positive,
    backgroundColor: '#dcfce7',
    ...shorthands.borderRadius('999px'),
    ...shorthands.padding('1px', '8px')
  },

  /* ---------- Bottom row ---------- */
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
    alignItems: 'start',
    ...shorthands.gap('12px'),
    '@media (max-width: 1280px)': {
      gridTemplateColumns: '1fr'
    }
  },
  rightStack: {
    display: 'grid',
    ...shorthands.gap('12px'),
    alignContent: 'start'
  },

  /* ---------- Products carousel ---------- */
  productsRow: {
    display: 'grid',
    gridTemplateColumns: '30px 1fr 30px',
    alignItems: 'center',
    ...shorthands.gap('8px')
  },
  productsTrack: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
    ...shorthands.gap('10px')
  },
  productCard: {
    position: 'relative',
    ...shorthands.border('1px', 'solid', palette.borderSoft),
    ...shorthands.borderRadius('10px'),
    backgroundColor: palette.surface,
    ':hover': {
      zIndex: 20,
      ...shorthands.borderColor(palette.brandStrong)
    }
  },
  productMedia: {
    ...shorthands.overflow('hidden'),
    borderTopLeftRadius: '10px',
    borderTopRightRadius: '10px',
    backgroundColor: palette.surface
  },
  productImage: {
    width: '100%',
    height: '160px',
    objectFit: 'contain',
    backgroundColor: palette.surface,
    ...shorthands.padding('6px'),
    display: 'block'
  },
  productZoom: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '240px',
    zIndex: 40,
    pointerEvents: 'none',
    backgroundColor: palette.surface,
    ...shorthands.border('1px', 'solid', palette.borderSoft),
    ...shorthands.borderRadius('12px'),
    ...shorthands.padding('10px'),
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.22)'
  },
  productZoomImage: {
    width: '100%',
    height: '220px',
    objectFit: 'contain',
    display: 'block'
  },
  productZoomCaption: {
    marginTop: '6px',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
    color: palette.inkStrong
  },
  productBody: {
    ...shorthands.padding('8px')
  },
  productName: {
    fontSize: '11px',
    color: palette.ink,
    lineHeight: '1.25',
    minHeight: '28px'
  },
  productSales: {
    fontSize: '17px',
    lineHeight: '1.1',
    fontWeight: 700,
    color: palette.inkStrong,
    marginTop: '2px'
  },
  productUnits: {
    fontSize: '10px',
    color: palette.inkMuted
  },

  /* ---------- Store comparison table ---------- */
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeadCell: {
    ...shorthands.borderBottom('1px', 'solid', palette.borderSoft),
    ...shorthands.padding('6px', '6px'),
    textAlign: 'left',
    fontSize: '10px',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
    color: palette.inkFaint
  },
  tableCell: {
    ...shorthands.borderBottom('1px', 'solid', palette.borderSoft),
    ...shorthands.padding('7px', '6px'),
    textAlign: 'left',
    fontSize: '12px',
    color: palette.ink
  },
  tableDelta: {
    color: palette.positive,
    fontWeight: 600
  },

  /* ---------- Footer & settings ---------- */
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    ...shorthands.gap('8px'),
    ...shorthands.padding('6px', '2px', '2px'),
    color: palette.inkMuted,
    fontSize: '11px'
  },
  footerMeta: {
    display: 'flex',
    alignItems: 'center',
    ...shorthands.gap('6px')
  },
  settingsForm: {
    display: 'grid',
    ...shorthands.gap('14px'),
    marginTop: '8px'
  },
  settingsField: {
    display: 'grid',
    ...shorthands.gap('4px')
  },
  settingsActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px'
  },
  settingsError: {
    ...shorthands.padding('8px', '10px'),
    ...shorthands.borderRadius('8px'),
    backgroundColor: '#fdecea',
    color: '#b42318',
    fontSize: '12px',
    lineHeight: '16px'
  },
  settingsPanel: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '320px',
    maxWidth: '85%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.surface,
    ...shorthands.borderLeft('1px', 'solid', palette.borderSoft),
    boxShadow: '-12px 0 32px rgba(15, 23, 42, 0.18)',
    transform: 'translateX(105%)',
    transitionProperty: 'transform',
    transitionDuration: '0.25s',
    transitionTimingFunction: 'ease',
    zIndex: 60,
    willChange: 'transform'
  },
  settingsPanelOpen: {
    transform: 'translateX(0)'
  },
  settingsPanelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.gap('8px'),
    ...shorthands.padding('14px', '16px'),
    ...shorthands.borderBottom('1px', 'solid', palette.borderSoft)
  },
  settingsPanelTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: palette.inkStrong
  },
  settingsPanelBody: {
    flexGrow: 1,
    ...shorthands.overflow('hidden', 'auto'),
    ...shorthands.padding('16px')
  },
  filtersPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: '320px',
    maxWidth: '85%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: palette.surface,
    ...shorthands.borderRight('1px', 'solid', palette.borderSoft),
    boxShadow: '12px 0 32px rgba(15, 23, 42, 0.18)',
    transform: 'translateX(-105%)',
    transitionProperty: 'transform',
    transitionDuration: '0.25s',
    transitionTimingFunction: 'ease',
    zIndex: 60,
    willChange: 'transform'
  },
  filtersPanelOpen: {
    transform: 'translateX(0)'
  },
  filtersSection: {
    display: 'grid',
    ...shorthands.gap('8px'),
    ...shorthands.padding('0', '0', '18px'),
    ...shorthands.borderBottom('1px', 'solid', palette.borderSoft),
    marginBottom: '16px'
  },
  filtersSectionLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: palette.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: '0.04em'
  },
  filtersSwitchList: {
    display: 'grid',
    ...shorthands.gap('6px')
  },
  clickablePill: {
    cursor: 'pointer',
    fontFamily: 'inherit',
    ...shorthands.margin('0'),
    ':hover': {
      backgroundColor: palette.brandSofter,
      ...shorthands.borderColor(palette.brandStrong)
    }
  },
  linkText: {
    fontSize: '11px',
    color: palette.brandStrong,
    fontWeight: 600,
    cursor: 'default'
  }
});
