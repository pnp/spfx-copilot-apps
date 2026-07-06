// Time-Off Overview Copilot Component.
//
// Mirrors the EmployeeOnboarding lifecycle: the class owns the bridge to the
// SPFx Copilot host and the data service; the React tree (`TimeOffApp`) is
// purely props-driven.
//
// Lifecycle:
//   - onInit               : build the live SharePoint data service via the
//                            factory, await its first load, then subscribe so
//                            any service mutation (Cancel) triggers a re-render.
//   - render               : mount / re-render the React tree into
//                            `this.context.domElement`.
//   - onHostContextChanged : let the base class re-render on theme /
//                            displayMode / containerDimensions changes.
//   - onDispose            : unsubscribe from the data service and unmount React.
//
// One tool lands on this component:
//   - GetMyTimeOff : optional leaveType to highlight one balance; renders the
//                    full overview (balances + upcoming + recent history).
//
// The data service now fetches live from SharePoint via
// this.context.spHttpClient (and Microsoft Graph in Component B) — the
// delegated, client-side calls that distinguish SPFx Copilot Components from
// generic MCP apps. The factory falls back to in-memory demo data if the lists
// are missing or a call fails, so the UI never changes and always renders.

import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { BaseCopilotComponent } from '@microsoft/sp-copilot-component';
import type { ICopilotComponentHostContext } from '@microsoft/sp-copilot-component';

import { TimeOffApp } from './ui/TimeOffApp';
import type { ITimeOffDataService } from './data/ITimeOffDataService';
import { createTimeOffDataService } from './data/createTimeOffDataService';
import { loadCalendarConflicts } from '../timeOffRequest/logic/loadCalendarConflicts';
import type { IConflictCheckResult } from '../timeOffRequest/logic/conflicts';
import type { ITimeOffOverviewCopilotComponentProperties } from './TimeOffOverviewCopilotComponentProperties';

export default class TimeOffOverviewCopilotComponent extends BaseCopilotComponent<ITimeOffOverviewCopilotComponentProperties> {
  private _dataService!: ITimeOffDataService;
  private _unsubscribe?: () => void;
  // Bumps every time render() runs. Passed to the React tree so it can detect a
  // fresh tool invocation (vs a passive re-render from host-context changes or
  // data-service mutations) and re-seed its local UI state.
  private _propertiesVersion: number = 0;

  protected async onInit(): Promise<void> {
    // Build the live SharePoint data service (delegated, client-side REST) and
    // await its initial load before the first render, so the tree paints with
    // real data instead of flashing empty. The factory self-heals to demo data
    // if the lists are missing or a call fails, so this never rejects.
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
      <TimeOffApp
        dataService={this._dataService}
        hostContext={this.hostContext}
        onRequestFullscreen={this._handleRequestFullscreen}
        checkConflicts={this._loadConflicts}
        initialHighlight={this.properties.leaveType}
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
  // path) so it reuses the exact same live-calendar conflict check as the
  // standalone Request component. Delegates to the shared loadCalendarConflicts
  // helper; never throws — on failure it returns sample data tagged 'sample'.
  private _loadConflicts = (
    startIso: string,
    endIso: string
  ): Promise<IConflictCheckResult> =>
    loadCalendarConflicts(this.context, startIso, endIso);
}
