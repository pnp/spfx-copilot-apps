// Factory that wires the live SharePoint data service to the Copilot host.
//
// This is the ONLY place that touches @microsoft/sp-http, so the data service
// itself stays free of SPFx types and trivially unit-testable. Here we adapt
// the host's delegated SPHttpClient to the narrow ITimeOffHttpClient port and
// hand the component a fully-loaded ITimeOffDataService.
//
// The SPHttpClient call carries the signed-in user's identity automatically —
// the client-side, authenticated SharePoint access that sets SPFx Copilot
// Components apart from generic MCP apps.

import { SPHttpClient } from '@microsoft/sp-http';
import type { ISPHttpClientOptions } from '@microsoft/sp-http';
import type { CopilotComponentContext } from '@microsoft/sp-copilot-component';

import { InMemoryTimeOffDataService } from './InMemoryTimeOffDataService';
import type { ITimeOffDataService } from './ITimeOffDataService';
import {
  SharePointTimeOffDataService,
  type ITimeOffHttpClient,
  type ITimeOffManager,
  type ITimeOffManagerLookup
} from './SharePointTimeOffDataService';
import { resolveListsWebUrl, resolveListsSitePath } from '../../shared/listsSiteConfig';

/**
 * Build and load the live SharePoint data service from the Copilot component
 * context. `load()` never throws and self-heals to demo data, so the returned
 * service is always render-ready. The outer try/catch is a final safety net for
 * an unexpected context shape (returns the pure in-memory demo service).
 */
export async function createTimeOffDataService(
  context: CopilotComponentContext
): Promise<ITimeOffDataService> {
  try {
    const spHttpClient = context.spHttpClient;

    const http: ITimeOffHttpClient = {
      get: (url, headers) =>
        spHttpClient.get(url, SPHttpClient.configurations.v1, { headers }),
      post: (url, headers, body) => {
        const options: ISPHttpClientOptions = { headers, body };
        return spHttpClient.post(url, SPHttpClient.configurations.v1, options);
      }
    };

    // Take the host from the page context and resolve the lists SITE PATH. The
    // path is the compiled-in default (TIME_OFF_LISTS_SITE_PATH) unless an admin
    // set the 'TimeOffSite' tenant property, which wins at runtime. Pinning the
    // site makes REST calls work inside Copilot/BizChat, where the ambient web is
    // the tenant root and not the site holding the lists.
    const ambientWebUrl = context.pageContext.web.absoluteUrl;
    const listsSitePath = await resolveListsSitePath(http, ambientWebUrl);

    // Adapt the host's MSGraphClientV3 to the narrow manager-lookup port. This is
    // a delegated, client-side Graph call (/me/manager) under the user's own
    // identity — the same headline capability as the calendar-conflicts check.
    // Never throws: a 404 (no manager) or any failure resolves to undefined, and
    // the service then records the submitter as their own approver (demo fallback).
    const managerLookup: ITimeOffManagerLookup = {
      getMyManager: async (): Promise<ITimeOffManager | undefined> => {
        try {
          const client = await context.msGraphClientFactory.getClient('3');
          const mgr = (await client
            .api('/me/manager')
            .select('id,displayName,mail,userPrincipalName')
            .get()) as {
            displayName?: string;
            mail?: string;
            userPrincipalName?: string;
          };
          if (!mgr) {
            return undefined;
          }
          return {
            displayName: mgr.displayName,
            email: mgr.mail || mgr.userPrincipalName
          };
        } catch {
          // No manager (Graph 404), User.Read not consented, or offline.
          return undefined;
        }
      }
    };

    const service = new SharePointTimeOffDataService({
      http,
      webAbsoluteUrl: resolveListsWebUrl(ambientWebUrl, listsSitePath),
      currentUser: {
        displayName: context.pageContext.user.displayName,
        email: context.pageContext.user.email,
        loginName: context.pageContext.user.loginName
      },
      managerLookup
    });

    await service.load();
    return service;
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Time-Off] createTimeOffDataService failed, using demo data',
        err
      );
    }
    return new InMemoryTimeOffDataService();
  }
}
