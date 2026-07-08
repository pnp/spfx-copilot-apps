// Factory that wires the live SharePoint TEAM data service to the Copilot host.
//
// Mirrors createTimeOffDataService: this is the only place that touches
// @microsoft/sp-http, so the team data service stays free of SPFx types and
// trivially unit-testable. We adapt the host's delegated SPHttpClient to the
// narrow ITimeOffHttpClient port and hand the component a fully-loaded
// ITimeOffTeamDataService.
//
// The SPHttpClient call carries the signed-in manager's identity automatically —
// the client-side, authenticated SharePoint access (read-all + MERGE writes)
// that sets SPFx Copilot Components apart from generic MCP apps.

import { SPHttpClient } from '@microsoft/sp-http';
import type { ISPHttpClientOptions, MSGraphClientV3 } from '@microsoft/sp-http';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import type { CopilotComponentContext } from '@microsoft/sp-copilot-component';

import { InMemoryTimeOffTeamDataService } from './InMemoryTimeOffTeamDataService';
import type { ITimeOffTeamDataService } from './ITimeOffTeamDataService';
import {
  SharePointTimeOffTeamDataService,
  type ITeamDirectoryLookup
} from './SharePointTimeOffTeamDataService';
import type { ITeamMember, TeamMemberRelationship } from './types';
import type { ITimeOffHttpClient } from '../../timeOffOverview/data/SharePointTimeOffDataService';
import { resolveListsWebUrl, resolveListsSitePath } from '../../shared/listsSiteConfig';

/** Minimal Microsoft Graph user shape used to build a team member. */
interface IGraphUser {
  id?: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
  jobTitle?: string;
}

/** Map a Graph user to an ITeamMember, or undefined when it has no usable email. */
function toMember(
  user: IGraphUser | undefined,
  relationship: TeamMemberRelationship
): ITeamMember | undefined {
  if (!user) {
    return undefined;
  }
  const email = (user.mail || user.userPrincipalName || '').trim();
  if (!email) {
    return undefined;
  }
  const member: ITeamMember = {
    email,
    displayName: user.displayName || email,
    relationship
  };
  if (user.jobTitle) {
    member.jobTitle = user.jobTitle;
  }
  if (user.id) {
    member.userId = user.id;
  }
  return member;
}

/** Convert a Blob to a base64 data URL; resolves undefined on any reader error. */
function blobToDataUrl(blob: Blob): Promise<string | undefined> {
  return new Promise<string | undefined>((resolve) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === 'string' ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    } catch {
      resolve(undefined);
    }
  });
}

/**
 * Fetch a member's Microsoft 365 profile photo as a data URL, under the signed-in
 * user's delegated identity — the same client-side, authenticated Graph capability
 * the rest of the component uses. `userKey` may be an object id OR a UPN/email,
 * since Graph resolves /users/{key} for either. Tries the small 48x48 rendition
 * first (the Avatar renders at 28px, so a tiny image keeps the inlined data URL
 * small) and falls back to the default photo. Returns undefined on any failure — no
 * photo, no consent, or a mailbox-less account — so the Avatar simply shows the
 * member's initials. NEVER throws.
 */
async function fetchPhotoDataUrl(
  client: MSGraphClientV3,
  userKey: string
): Promise<string | undefined> {
  const getBlob = async (path: string): Promise<Blob | undefined> => {
    try {
      const blob = (await client
        .api(path)
        .responseType(ResponseType.BLOB)
        .get()) as Blob | undefined;
      return blob && blob.size > 0 ? blob : undefined;
    } catch {
      return undefined;
    }
  };
  const encoded = encodeURIComponent(userKey);
  const blob =
    (await getBlob(`/users/${encoded}/photos/48x48/$value`)) ||
    (await getBlob(`/users/${encoded}/photo/$value`));
  return blob ? await blobToDataUrl(blob) : undefined;
}

/**
 * Build and load the live SharePoint team data service from the Copilot
 * component context. `load()` never throws and self-heals to demo data, so the
 * returned service is always render-ready. The outer try/catch is a final safety
 * net for an unexpected context shape (returns the pure in-memory demo service).
 */
export async function createTimeOffTeamDataService(
  context: CopilotComponentContext
): Promise<ITimeOffTeamDataService> {
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

    // Resolve the signed-in user's team from Microsoft Graph under their own
    // delegated identity — the same client-side, authenticated capability the
    // calendar-conflict and manager lookups use. Self (/me) + manager
    // (/me/manager) + peers (/me/manager/directReports) + reports
    // (/me/directReports). Each call is isolated so one failure (e.g. directReports
    // needs User.Read.All, which may be unconsented) just drops that slice. Returns
    // undefined unless a real peer/report was found, so the service self-heals to a
    // demo roster derived from the request rows. NEVER throws.
    const directoryLookup: ITeamDirectoryLookup = {
      getTeam: async (): Promise<ITeamMember[] | undefined> => {
        try {
          const client = await context.msGraphClientFactory.getClient('3');
          const select = 'id,displayName,mail,userPrincipalName,jobTitle';

          const getOne = async (path: string): Promise<IGraphUser | undefined> => {
            try {
              return (await client.api(path).select(select).get()) as IGraphUser;
            } catch {
              return undefined;
            }
          };
          const getMany = async (path: string): Promise<IGraphUser[]> => {
            try {
              const res = (await client.api(path).select(select).get()) as {
                value?: IGraphUser[];
              };
              return (res && res.value) || [];
            } catch {
              return [];
            }
          };

          const me = await getOne('/me');
          const manager = await getOne('/me/manager');
          const peers = await getMany('/me/manager/directReports');
          const reports = await getMany('/me/directReports');

          // Dedup case-insensitively by email; on collision keep the strongest
          // relationship (self > manager > report > peer).
          const priority: { [k in TeamMemberRelationship]: number } = {
            self: 0,
            manager: 1,
            report: 2,
            peer: 3
          };
          const byEmail = new Map<string, ITeamMember>();
          const add = (m: ITeamMember | undefined): void => {
            if (!m) {
              return;
            }
            const key = m.email.toLowerCase();
            const existing = byEmail.get(key);
            if (!existing || priority[m.relationship] < priority[existing.relationship]) {
              byEmail.set(key, m);
            }
          };

          add(toMember(me, 'self'));
          add(toMember(manager, 'manager'));
          peers.forEach((p) => add(toMember(p, 'peer')));
          reports.forEach((r) => add(toMember(r, 'report')));

          const all = Array.from(byEmail.values());
          const hasTeam = all.some(
            (m) => m.relationship === 'peer' || m.relationship === 'report'
          );
          if (!hasTeam) {
            return undefined;
          }

          // Enrich the real roster with profile photos (best-effort, in parallel).
          // Each fetch is isolated and self-failing, so a missing photo or an
          // unconsented User.Read.All just leaves that member on initials. We
          // resolve all URLs first, then assign synchronously, so there is no
          // read-modify-write across an await.
          const photos = await Promise.all(
            all.map(async (m) => ({
              m,
              url: m.userId ? await fetchPhotoDataUrl(client, m.userId) : undefined
            }))
          );
          photos.forEach(({ m, url }) => {
            if (url) {
              m.photoUrl = url;
            }
          });
          return all;
        } catch {
          return undefined;
        }
      },

      // Best-effort profile photos for the "who's out" list and approvals inbox,
      // whose people are anyone with a request — not just the calendar roster, so
      // the roster photo map alone can't cover them. Each email is resolved by
      // /users/{email} (Graph accepts a UPN/email as the key), in parallel and
      // self-failing, then assigned synchronously so there is no read-modify-write
      // across an await. Keyed lower-cased; misses (alias != UPN, no photo, no
      // consent) simply drop out and the Avatar shows initials. NEVER throws.
      getPhotos: async (
        emails: readonly string[]
      ): Promise<{ [emailLower: string]: string }> => {
        const out: { [emailLower: string]: string } = {};
        try {
          const client = await context.msGraphClientFactory.getClient('3');
          const distinct = Array.from(
            new Set(
              emails.map((e) => (e || '').trim().toLowerCase()).filter((e) => !!e)
            )
          );
          const results = await Promise.all(
            distinct.map(async (email) => ({
              email,
              url: await fetchPhotoDataUrl(client, email)
            }))
          );
          results.forEach(({ email, url }) => {
            if (url) {
              out[email] = url;
            }
          });
        } catch {
          // ignore — return whatever resolved (possibly empty); initials fallback
        }
        return out;
      }
    };

    const service = new SharePointTimeOffTeamDataService({
      http,
      webAbsoluteUrl: resolveListsWebUrl(ambientWebUrl, listsSitePath),
      currentUser: {
        displayName: context.pageContext.user.displayName,
        email: context.pageContext.user.email,
        loginName: context.pageContext.user.loginName
      },
      directoryLookup
    });

    await service.load();
    return service;
  } catch (err) {
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        '[Time-Off] createTimeOffTeamDataService failed, using demo data',
        err
      );
    }
    return new InMemoryTimeOffTeamDataService();
  }
}
