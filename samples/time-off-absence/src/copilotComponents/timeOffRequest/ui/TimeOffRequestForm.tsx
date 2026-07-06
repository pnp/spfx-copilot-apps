// Shared, shell-free request form for the Time-Off scenario.
//
// This is the body that used to live inside TimeOffRequestApp. It was extracted
// so TWO entry points can render the identical request experience:
//   * Component B (RequestTimeOff) — TimeOffRequestApp wraps it in the Griffel +
//     Fluent shell. The standalone form has no header action of its own.
//   * Component A (GetMyTimeOff) — the overview embeds it inline when the user
//     clicks "Request time off", passing `onBack` instead so the header offers a
//     "Back" button that returns to the overview. The three components stay
//     SEPARATE for Copilot tool routing; this is purely an in-component shortcut.
//
// The form takes no FluentProvider/RendererProvider of its own — it always runs
// under a host shell that provides them. It DOES apply the inline theme CSS
// custom properties (themeVars) on its own root so every descendant's
// var(--token) resolves inside the sandboxed Copilot iframe.
//
// Control choice is deliberate (and must stay this way): theme tokens resolve via
// inline CSS custom properties that inherit by cascade, so any Fluent control
// that PORTALS its popup out of this subtree (Dropdown listbox, DatePicker
// callout) would render unstyled in the Copilot host. Every control here stays
// in-tree: RadioGroup for leave type, a native <input type="date"> for dates,
// Textarea for the note, MessageBar/Spinner for the conflict result.

import * as React from 'react';
import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  makeStyles,
  tokens,
  Title3,
  Body1,
  Caption1,
  Text,
  Button,
  Divider,
  Label,
  RadioGroup,
  Radio,
  Textarea,
  Spinner,
  MessageBar,
  MessageBarBody,
  MessageBarTitle
} from '@fluentui/react-components';
import { ArrowLeftRegular } from '@fluentui/react-icons';

import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import type { ITimeOffDataService } from '../../timeOffOverview/data/ITimeOffDataService';
import type { LeaveType, ITimeOffRequest } from '../../timeOffOverview/data/types';
import {
  formatDateRange,
  daysLabel,
  profileSubtitle,
  toIsoDate
} from '../../timeOffOverview/ui/format';
import { workingDaysBetween } from '../logic/workdays';
import type {
  ICalendarConflict,
  IConflictCheckResult
} from '../logic/conflicts';

const useStyles = makeStyles({
  root: {
    boxSizing: 'border-box',
    width: '100%',
    height: '100%',
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
    fontFamily: tokens.fontFamilyBase,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXXS
  },
  subtle: {
    color: tokens.colorNeutralForeground3
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS
  },
  dateRow: {
    display: 'flex',
    gap: tokens.spacingHorizontalM,
    flexWrap: 'wrap'
  },
  dateCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalXS,
    flex: '1 1 160px',
    minWidth: '160px'
  },
  // Native date input themed with Fluent tokens so it matches the surrounding
  // v9 controls. The picker popup itself is browser-rendered (no portal, no
  // Fluent styling needed), which is exactly why it is safe in the iframe host.
  dateInput: {
    boxSizing: 'border-box',
    height: '32px',
    padding: `0 ${tokens.spacingHorizontalM}`,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300
  },
  summary: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1
  },
  conflictRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS
  },
  conflictItem: {
    display: 'block'
  },
  actions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    alignItems: 'center'
  },
  successWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalL
  }
});

function leaveLabel(type: LeaveType): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function sourceCaption(source: IConflictCheckResult['source']): string {
  switch (source) {
    case 'graph':
      return 'Checked against your Microsoft 365 calendar.';
    case 'sample':
      return 'Showing sample calendar data \u2014 your live calendar is not available here.';
    default:
      return '';
  }
}

function conflictWhen(c: ICalendarConflict): string {
  if (c.isAllDay) {
    return 'All day';
  }
  const fmt = (s: string): string => {
    const d = new Date(s);
    return Number.isNaN(d.getTime())
      ? ''
      : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  };
  const start = fmt(c.startDateTime);
  const end = fmt(c.endDateTime);
  if (start && end) {
    return `${start} \u2013 ${end}`;
  }
  return start || end || '';
}

export interface ITimeOffRequestFormProps {
  dataService: ITimeOffDataService;
  hostContext: ICopilotComponentHostContext;
  // Delegated, client-side Microsoft Graph conflict check owned by the host
  // class. Never rejects: it falls back to deterministic sample data and tags
  // the result source so this form can be honest about what it shows.
  checkConflicts: (
    startIso: string,
    endIso: string
  ) => Promise<IConflictCheckResult>;
  // Theme tokens as inline CSS custom properties, applied on the form root so
  // every descendant's var(--token) resolves regardless of the host's behaviour.
  themeVars: CSSProperties;
  // Seeds from the invoking tool (Component B). Off-contract values are tolerated
  // and normalized via toIsoDate.
  initialLeaveType?: LeaveType;
  initialStartDate?: string;
  initialEndDate?: string;
  initialNote?: string;
  // Embedded (Component A overview): render a "Back" button that returns to the
  // overview.
  onBack?: () => void;
}

export function TimeOffRequestForm(
  props: ITimeOffRequestFormProps
): React.ReactElement {
  const {
    dataService,
    hostContext,
    checkConflicts,
    initialLeaveType,
    initialStartDate,
    initialEndDate,
    initialNote,
    onBack,
    themeVars
  } = props;
  const styles = useStyles();

  const profile = dataService.getProfile();
  const holidays = dataService.getHolidays();

  const [leaveType, setLeaveType] = useState<LeaveType>(
    initialLeaveType || 'vacation'
  );
  // Seeds arrive from tool properties and may be off-contract (the schema asks
  // for ISO yyyy-mm-dd, but manual testers often type mm/dd/yyyy etc). Normalize
  // so the native date input populates and never feeds a bad value to render.
  const [startDate, setStartDate] = useState<string>(toIsoDate(initialStartDate));
  const [endDate, setEndDate] = useState<string>(toIsoDate(initialEndDate));
  const [note, setNote] = useState<string>(initialNote || '');
  const [submitted, setSubmitted] = useState<ITimeOffRequest | undefined>(
    undefined
  );

  const [conflictLoading, setConflictLoading] = useState<boolean>(false);
  const [conflictResult, setConflictResult] = useState<
    IConflictCheckResult | undefined
  >(undefined);
  // Guards against out-of-order responses: only the latest check applies.
  const checkIdRef = React.useRef<number>(0);

  const rangeValid =
    Boolean(startDate) && Boolean(endDate) && endDate >= startDate;
  const workingDays = useMemo(
    () => workingDaysBetween(startDate, endDate, holidays),
    [startDate, endDate, holidays]
  );

  React.useEffect(() => {
    if (!rangeValid) {
      setConflictResult(undefined);
      setConflictLoading(false);
      return;
    }
    const myId = checkIdRef.current + 1;
    checkIdRef.current = myId;
    setConflictLoading(true);
    checkConflicts(startDate, endDate)
      .then((res) => {
        if (checkIdRef.current === myId) {
          setConflictResult(res);
          setConflictLoading(false);
        }
      })
      .catch(() => {
        if (checkIdRef.current === myId) {
          setConflictResult({
            source: 'none',
            conflicts: [],
            message: 'Could not check your calendar.'
          });
          setConflictLoading(false);
        }
      });
  }, [startDate, endDate, rangeValid, checkConflicts]);

  const handleSubmit = (): void => {
    const created = dataService.createRequest({
      leaveType,
      startDate,
      endDate,
      workingDays,
      ...(note ? { note } : {})
    });
    setSubmitted(created);
  };

  const handleReset = (): void => {
    setSubmitted(undefined);
    setLeaveType('vacation');
    setStartDate('');
    setEndDate('');
    setNote('');
    setConflictResult(undefined);
    setConflictLoading(false);
  };

  const isDark = hostContext.theme === 'dark';
  const canSubmit = rangeValid && workingDays > 0;

  // Header action: a Back button is shown only when the form is embedded in the
  // overview. The standalone request component has no header action of its own.
  let headerAction: React.ReactElement | undefined;
  if (onBack) {
    headerAction = (
      <Button
        appearance="subtle"
        icon={<ArrowLeftRegular />}
        onClick={onBack}
        aria-label="Back to overview"
      >
        Back
      </Button>
    );
  }

  return (
    <div className={styles.root} style={themeVars}>
      <div className={styles.header}>
        <div className={styles.headerText}>
          <Title3>Request time off</Title3>
          <Body1>{profile.displayName}</Body1>
          {profileSubtitle(profile) ? (
            <Caption1 className={styles.subtle}>
              {profileSubtitle(profile)}
            </Caption1>
          ) : null}
        </div>
        {headerAction}
      </div>

      <Divider />

      {submitted ? (
        <div className={styles.successWrap}>
          <MessageBar intent="success">
            <MessageBarBody>
              <MessageBarTitle>Request submitted</MessageBarTitle>
              Your {leaveLabel(submitted.leaveType)} request for{' '}
              {formatDateRange(submitted.startDate, submitted.endDate)} (
              {daysLabel(submitted.workingDays)}) was submitted for approval.
            </MessageBarBody>
          </MessageBar>
          <div className={styles.actions}>
            <Button appearance="primary" onClick={handleReset}>
              Book another request
            </Button>
            {onBack ? (
              <Button appearance="secondary" onClick={onBack}>
                Back to overview
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className={styles.form}>
          <div className={styles.field}>
            <Label weight="semibold">Leave type</Label>
            <RadioGroup
              layout="horizontal"
              value={leaveType}
              onChange={(_, data) => setLeaveType(data.value as LeaveType)}
            >
              <Radio value="vacation" label="Vacation" />
              <Radio value="sick" label="Sick" />
              <Radio value="personal" label="Personal" />
            </RadioGroup>
          </div>

          <div className={styles.dateRow}>
            <div className={styles.dateCol}>
              <Label htmlFor="to-start" weight="semibold">
                Start date
              </Label>
              <input
                id="to-start"
                type="date"
                className={styles.dateInput}
                style={{ colorScheme: isDark ? 'dark' : 'light' }}
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.dateCol}>
              <Label htmlFor="to-end" weight="semibold">
                End date
              </Label>
              <input
                id="to-end"
                type="date"
                className={styles.dateInput}
                style={{ colorScheme: isDark ? 'dark' : 'light' }}
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <Label htmlFor="to-note" weight="semibold">
              Note (optional)
            </Label>
            <Textarea
              id="to-note"
              value={note}
              placeholder="Add a short reason, e.g. Family trip"
              onChange={(_, data) => setNote(data.value)}
            />
          </div>

          {rangeValid ? (
            <Text className={styles.summary}>
              {daysLabel(workingDays)} of {leaveLabel(leaveType)} leave {'\u00b7'}{' '}
              {formatDateRange(startDate, endDate)}
            </Text>
          ) : (
            <Caption1 className={styles.subtle}>
              Pick a start and end date to see the working-day total.
            </Caption1>
          )}

          {rangeValid && conflictLoading && (
            <div className={styles.conflictRow}>
              <Spinner size="tiny" />
              <Caption1>Checking your calendar{'\u2026'}</Caption1>
            </div>
          )}

          {rangeValid && !conflictLoading && conflictResult && (
            <ConflictNotice result={conflictResult} styles={styles} />
          )}

          <div className={styles.actions}>
            <Button
              appearance="primary"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              Submit request
            </Button>
            {rangeValid && workingDays === 0 && (
              <Caption1 className={styles.subtle}>
                The selected range has no working days.
              </Caption1>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface IConflictNoticeProps {
  result: IConflictCheckResult;
  styles: Record<string, string>;
}

function ConflictNotice(props: IConflictNoticeProps): React.ReactElement {
  const { result, styles } = props;

  if (result.source === 'none') {
    return (
      <MessageBar intent="info">
        <MessageBarBody>
          {result.message || 'Calendar check is unavailable right now.'}
        </MessageBarBody>
      </MessageBar>
    );
  }

  if (result.conflicts.length === 0) {
    return (
      <MessageBar intent="success">
        <MessageBarBody>
          <MessageBarTitle>No calendar conflicts</MessageBarTitle>
          <Caption1 className={styles.subtle}>
            {sourceCaption(result.source)}
          </Caption1>
        </MessageBarBody>
      </MessageBar>
    );
  }

  return (
    <MessageBar intent="warning">
      <MessageBarBody>
        <MessageBarTitle>
          {result.conflicts.length === 1
            ? '1 possible calendar conflict'
            : `${result.conflicts.length} possible calendar conflicts`}
        </MessageBarTitle>
        {result.conflicts.map((c, i) => (
          <span key={i} className={styles.conflictItem}>
            {c.subject} {'\u00b7'} {conflictWhen(c)}
          </span>
        ))}
        <Caption1 className={styles.subtle}>
          {sourceCaption(result.source)}
        </Caption1>
      </MessageBarBody>
    </MessageBar>
  );
}
