// Time-Off Request Copilot Component.
//
// Mirrors the timeOffOverview lifecycle: the class owns the bridge to the SPFx
// Copilot host, the data service and — uniquely — the live, delegated Microsoft
// Graph call. The React tree (`TimeOffRequestApp`) is purely props-driven.
//
// Lifecycle:
//   - onInit               : instantiate the in-memory data service, subscribe
//                            so a created request triggers a re-render.
//   - render               : mount / re-render the React tree into
//                            `this.context.domElement`.
//   - onHostContextChanged : let the base class re-render on theme /
//                            displayMode / containerDimensions changes.
//   - onDispose            : unsubscribe from the data service and unmount React.
//
// One tool lands on this component:
//   - RequestTimeOff : optional leaveType / startDate / endDate / note to
//                      pre-fill the form; the user reviews working days and
//                      calendar conflicts, then submits.
//
// Showcase capability — the client-side Graph call:
//   `_loadConflicts` runs a DELEGATED /me/calendarView query directly from the
//   browser using the signed-in user's identity. This is the headline
//   differentiator of SPFx Copilot Components over generic MCP apps: a Copilot
//   component can call SharePoint / Microsoft Graph client-side. When the call
//   can't run (Workbench, or Calendars.Read not yet admin-approved) we fall
//   back to deterministic sample data and tell the UI, so the demo always
//   renders and stays honest about the source.

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import { TimeOffRequestApp } from './ui/TimeOffRequestApp';
import type { ITimeOffDataService } from '../timeOffOverview/data/ITimeOffDataService';
import { createTimeOffDataService } from '../timeOffOverview/data/createTimeOffDataService';
import { loadCalendarConflicts } from './logic/loadCalendarConflicts';
import type { IConflictCheckResult } from './logic/conflicts';
import type { ITimeOffRequestCopilotComponentProperties } from './TimeOffRequestCopilotComponentProperties';

export default class TimeOffRequestCopilotComponent extends BaseCopilotComponent<ITimeOffRequestCopilotComponentProperties> {
  private _dataService!: ITimeOffDataService;
  private _unsubscribe?: () => void;
  // Bumps every time render() runs. Passed to the React tree so it can detect a
  // fresh tool invocation (vs a passive re-render from host-context changes or
  // data-service mutations).
  private _propertiesVersion: number = 0;

  protected async onInit(): Promise<void> {
    // Live SharePoint data service (delegated, client-side REST), loaded before
    // the first render. Self-heals to demo data if the lists are missing or a
    // call fails, so this never rejects.
    this._dataService = await createTimeOffDataService(this.context);
    this._unsubscribe = this._dataService.subscribe((): void => {
      this.render();
    });
  }

  protected render(): void {
    if (!this.context || !this.context.domElement) {
      return;
    }

    this._propertiesVersion += 1;

    // Fluent v9 styles via Griffel are injected as <style> tags into a document
    // head. In the SPFx Copilot host the component renders inside its own iframe,
    // so we must target THAT document (domElement.ownerDocument) — otherwise the
    // styles land in the top window and nothing in the component is styled.
    const targetDocument: Document | undefined =
      this.context.domElement.ownerDocument || undefined;

    ReactDOM.render(
      <TimeOffRequestApp
        dataService={this._dataService}
        hostContext={this.hostContext}
        checkConflicts={this._loadConflicts}
        initialLeaveType={this.properties.leaveType}
        initialStartDate={this.properties.startDate}
        initialEndDate={this.properties.endDate}
        initialNote={this.properties.note}
        propertiesVersion={this._propertiesVersion}
        targetDocument={targetDocument}
      />,
      this.context.domElement
    );
  }

  protected onHostContextChanged(
    _diff: Partial<ICopilotComponentHostContext>
  ): void {
    /* render() is called by the base class automatically — covers theme,
       displayMode and containerDimensions changes. */
  }

  protected onDispose(): void {
    if (this._unsubscribe) {
      this._unsubscribe();
      this._unsubscribe = undefined;
    }
    if (this.context && this.context.domElement) {
      ReactDOM.unmountComponentAtNode(this.context.domElement);
    }
  }

  // The showcase: a delegated, client-side Microsoft Graph call for the signed-in
  // user. Delegates to the shared loadCalendarConflicts helper (the same one the
  // Overview component hands to its embedded request form), so the one Graph call
  // stays DRY. Never throws — on failure it returns sample data tagged 'sample'.
  private _loadConflicts = (
    startIso: string,
    endIso: string
  ): Promise<IConflictCheckResult> =>
    loadCalendarConflicts(this.context, startIso, endIso);
}
