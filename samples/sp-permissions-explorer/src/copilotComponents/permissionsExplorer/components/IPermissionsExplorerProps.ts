import type {
  ICopilotComponentHostContext,
  ISPCopilotBridge,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';

import type { IPermissionsToolInput } from '../models/IPermissionsToolInput';
import type { IPermissionsExplorerService } from '../services/PermissionsExplorerService';

export interface IPermissionsExplorerProps {
  /** Tool input provided by the Copilot host (site query, filter, principal query, ...). */
  toolInput: IPermissionsToolInput;
  /** Service facade used to resolve sites and fetch permissions. */
  service: IPermissionsExplorerService;
  /** Absolute URL of the current SharePoint site (host web). */
  currentWebUrl: string;
  /** Host context (theme, display mode) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Bridge to communicate with the Copilot host (public API surface). */
  bridge: ISPCopilotBridge;
  /** Request the host to change display mode (e.g. 'fullscreen'). */
  onRequestDisplayMode: (mode: SPCopilotDisplayMode) => Promise<void>;
  /** Request the host to resize the component iframe. */
  onRequestSizeChange: (width: number, height: number) => Promise<void>;
  /**
   * Document the FluentProvider should inject its theme styles into. Pass
   * `domElement.ownerDocument` so Griffel writes CSS into the correct iframe
   * document rather than the top-level page.
   */
  targetDocument: Document | undefined;
}
