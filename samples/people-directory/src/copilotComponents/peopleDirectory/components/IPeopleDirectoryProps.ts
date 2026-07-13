import type {
  ICopilotComponentHostContext,
  ISPCopilotBridge,
  SPCopilotDisplayMode
} from '@microsoft/sp-copilot-component';
import type { ServiceScope } from '@microsoft/sp-core-library';
import type { MSGraphClientFactory } from '@microsoft/sp-http';

export interface IPeopleDirectoryStrings {
  DirectoryTitle: string;
  SearchPlaceholder: string;
  LoadingLabel: string;
  NoResultsMessage: string;
  SearchErrorMessage: string;
  ExpandButtonLabel: string;
  ResizeButtonLabel: string;
  CompactButtonLabel: string;
  ChatButtonLabel: string;
  MailButtonLabel: string;
  InternalUsersFilterLabel: string;
  ActiveUsersFilterLabel: string;
  SiteBadgePrefix: string;
  ThemeBadgePrefix: string;
  ModeBadgePrefix: string;
  GreetingPrefix: string;
  UnknownTheme: string;
  DefaultDisplayMode: string;
}

export interface IPeopleDirectoryProps {
  /** The message passed as a tool argument from the Copilot host. */
  message: string;
  /**
   * The name/search term Copilot extracted from the user's request (tool
   * argument), e.g. 'Dharati Patel'. Preferred over parsing `message`.
   */
  inputQuery?: string;
  /** User display name fetched from Microsoft Graph /me. */
  userDisplayName: string;
  /** Site title fetched from SharePoint REST /_api/web. */
  siteTitle: string;
  /** Absolute URL of the current SharePoint site. */
  siteUrl: string;
  /** Host context (theme, display mode) from the Copilot host. */
  hostContext: ICopilotComponentHostContext;
  /** Bridge to communicate with the Copilot host (public API surface). */
  bridge: ISPCopilotBridge;
  /** Factory for a brokered-SSO Microsoft Graph client, used to search `/users`. */
  msGraphClientFactory: MSGraphClientFactory;
  /** SPFx service scope, passed to `LivePersona` for its presence/profile card lookups. */
  serviceScope: ServiceScope;
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
  /** Localized strings for UI labels. */
  strings: IPeopleDirectoryStrings;
}
