// Outer shell for the Time-Off Request Copilot Component (Component B).
//
// The request experience itself lives in the shared TimeOffRequestForm so the
// Overview component (A) can embed the identical form inline. This shell is the
// standalone host wiring only: it replicates the timeOffOverview pattern —
// RendererProvider + FluentProvider, both bound to the component's own document,
// with theme tokens also handed down as inline CSS custom properties so Fluent v9
// styling resolves inside the sandboxed Copilot iframe even when the host blocks
// Fluent's injected <style> (see themeToCssVars).
//
// This is the standalone entry point for the request component; it renders the
// shared form without any header action of its own.

import * as React from 'react';
import { useMemo } from 'react';
import {
  FluentProvider,
  RendererProvider,
  createDOMRenderer
} from '@fluentui/react-components';

import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import type { ITimeOffDataService } from '../../timeOffOverview/data/ITimeOffDataService';
import type { LeaveType } from '../../timeOffOverview/data/types';
import { resolveTheme } from '../../timeOffOverview/ui/theme';
import { themeToCssVars } from '../../timeOffOverview/ui/themeVars';
import type { IConflictCheckResult } from '../logic/conflicts';
import { TimeOffRequestForm } from './TimeOffRequestForm';

export interface ITimeOffRequestAppProps {
  dataService: ITimeOffDataService;
  hostContext: ICopilotComponentHostContext;
  // Delegated, client-side Microsoft Graph conflict check owned by the class.
  // Never rejects: the class falls back to deterministic sample data and tags
  // the result source so the form can be honest about what it shows.
  checkConflicts: (
    startIso: string,
    endIso: string
  ) => Promise<IConflictCheckResult>;
  // Seeds from the invoking tool.
  initialLeaveType?: LeaveType;
  initialStartDate?: string;
  initialEndDate?: string;
  initialNote?: string;
  propertiesVersion?: number;
  // The document the component is actually mounted in (an iframe doc in the
  // Copilot host). Both the Griffel renderer and FluentProvider must target it.
  targetDocument?: Document;
}

export function TimeOffRequestApp(
  props: ITimeOffRequestAppProps
): React.ReactElement {
  const {
    dataService,
    hostContext,
    checkConflicts,
    initialLeaveType,
    initialStartDate,
    initialEndDate,
    initialNote,
    targetDocument
  } = props;

  const theme = useMemo(
    () => resolveTheme(hostContext.theme),
    [hostContext.theme]
  );
  const renderer = useMemo(
    () => createDOMRenderer(targetDocument),
    [targetDocument]
  );
  const themeVars = useMemo(() => themeToCssVars(theme), [theme]);

  return (
    <RendererProvider renderer={renderer} targetDocument={targetDocument}>
      <FluentProvider theme={theme} targetDocument={targetDocument}>
        <TimeOffRequestForm
          dataService={dataService}
          hostContext={hostContext}
          checkConflicts={checkConflicts}
          initialLeaveType={initialLeaveType}
          initialStartDate={initialStartDate}
          initialEndDate={initialEndDate}
          initialNote={initialNote}
          themeVars={themeVars}
        />
      </FluentProvider>
    </RendererProvider>
  );
}
