// Time-Off Team Copilot Component (Component C).
//
// Mirrors the overview/request lifecycle: the class owns the bridge to the SPFx
// Copilot host and the team data service; the React tree (`TimeOffTeamApp`) is
// purely props-driven.
//
// Lifecycle:
//   - onInit               : build the live SharePoint TEAM data service via the
//                            factory, await its first load, then subscribe so any
//                            service mutation (Approve / Decline) re-renders.
//   - render               : mount / re-render the React tree into
//                            `this.context.domElement`.
//   - onHostContextChanged : let the base class re-render on theme /
//                            displayMode / containerDimensions changes.
//   - onDispose            : unsubscribe from the data service and unmount React.
//
// One tool lands on this component:
//   - GetTeamTimeOff : optional view ('whosOut' | 'approvals') to focus a
//                      section; renders the team's "who's out" list and, for a
//                      manager, the pending-approvals inbox.
//
// THE WRITE SHOWCASE: the data service reads the WHOLE team's requests and, on
// Approve/Decline, PATCHes a teammate's request Status via this.context.spHttpClient
// — delegated, client-side SharePoint writes that distinguish SPFx Copilot
// Components from generic MCP apps. The factory falls back to in-memory demo data
// if the list is missing or a call fails, so the UI never changes and always
// renders.

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import { TimeOffTeamApp } from './ui/TimeOffTeamApp';
import type { ITimeOffTeamDataService } from './data/ITimeOffTeamDataService';
import { createTimeOffTeamDataService } from './data/createTimeOffTeamDataService';
import type { ITimeOffDataService } from '../timeOffOverview/data/ITimeOffDataService';
import { createTimeOffDataService } from '../timeOffOverview/data/createTimeOffDataService';
import { loadCalendarConflicts } from '../timeOffRequest/logic/loadCalendarConflicts';
import type { IConflictCheckResult } from '../timeOffRequest/logic/conflicts';
import type { ITimeOffTeamCopilotComponentProperties } from './TimeOffTeamCopilotComponentProperties';

export default class TimeOffTeamCopilotComponent extends BaseCopilotComponent<ITimeOffTeamCopilotComponentProperties> {
  private _dataService!: ITimeOffTeamDataService;
  // The signed-in user's PERSONAL data service, used only by the embedded
  // "Request time off" form (it writes the current user's own request). Kept
  // separate from the team service, which reads/patches the WHOLE team.
  private _requestDataService!: ITimeOffDataService;
  private _unsubscribe?: () => void;
  // Bumps every time render() runs. Passed to the React tree so it can detect a
  // fresh tool invocation (vs a passive re-render from host-context changes or
  // data-service mutations) and re-seed its local UI state.
  private _propertiesVersion: number = 0;

  protected async onInit(): Promise<void> {
    // Build the live SharePoint team data service (delegated, client-side REST)
    // and await its initial load before the first render, so the tree paints
    // with real data instead of flashing empty. The factory self-heals to demo
    // data if the list is missing or a call fails, so this never rejects.
    this._dataService = await createTimeOffTeamDataService(this.context);
    // The embedded request form writes the signed-in user's OWN request, so it
    // needs the personal data service (same one Component A/B use), not the team
    // service. Built once here and handed to the tree.
    this._requestDataService = await createTimeOffDataService(this.context);
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
      <TimeOffTeamApp
        dataService={this._dataService}
        requestDataService={this._requestDataService}
        hostContext={this.hostContext}
        onRequestFullscreen={this._handleRequestFullscreen}
        checkConflicts={this._loadConflicts}
        initialView={this.properties.view}
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

  // Request fullscreen via the SPFx Copilot bridge. We don't mutate local state
  // here — the host may honor or deny the request, and either way the next
  // host-context change arrives via onHostContextChanged and re-renders with
  // the real displayMode.
  private _handleRequestFullscreen = async (): Promise<void> => {
    await this.requestDisplayModeAsync('fullscreen');
  };

  // The showcase: a delegated, client-side Microsoft Graph call for the signed-in
  // user. Handed to the embedded request form (the inline "Request time off"
  // path on the team screen) so it reuses the exact same live-calendar conflict
  // check as the standalone Request component. Never throws — on failure it
  // returns sample data tagged 'sample'.
  private _loadConflicts = (
    startIso: string,
    endIso: string
  ): Promise<IConflictCheckResult> =>
    loadCalendarConflicts(this.context, startIso, endIso);
}
