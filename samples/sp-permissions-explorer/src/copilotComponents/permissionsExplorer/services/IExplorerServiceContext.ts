import { SPHttpClient, MSGraphClientV3 } from '@microsoft/sp-http';

/**
 * Shared context passed to every explorer service. Provides the SPFx HTTP
 * clients and the host web URL. Services must not instantiate their own
 * clients; they always receive them via this context.
 */
export interface IExplorerServiceContext {
  spHttpClient: SPHttpClient;
  currentWebUrl: string;              // absolute URL of the host site
  getGraphClient: () => Promise<MSGraphClientV3>;
}
