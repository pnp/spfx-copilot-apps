import { IResolvedSite } from '../models/IResolvedSite';
import { IPermissionEntry } from '../models/IPermissionEntry';
import { IPermissionsSummary } from '../models/IPermissionsSummary';
import { SharePointRestService } from './SharePointRestService';
import { mapSpPrincipalType } from '../utils/principalTypeMapper';
import { isExternalUser } from '../utils/externalUserDetector';
import { IGNORED_PERMISSION_LEVELS } from '../utils/permissionLevels';
import { isLimitedAccessSystemPrincipal } from '../utils/systemPrincipals';
import { HttpError } from '../utils/retryPolicy';

interface ISpMemberRaw {
  Title?: string;
  LoginName?: string;
  PrincipalType?: number;
  Email?: string;
}

interface ISpRoleDefinitionRaw {
  Name?: string;
  Hidden?: boolean;
}

interface ISpRoleAssignmentRaw {
  PrincipalId?: number;
  Member?: ISpMemberRaw;
  RoleDefinitionBindings?: ISpRoleDefinitionRaw[];
}

interface ISpCollection<T> {
  value: T[];
}

interface ISpUserRaw {
  Id?: number;
  Title?: string;
  LoginName?: string;
  PrincipalType?: number;
  Email?: string;
}

/**
 * Retrieves and shapes SharePoint permission data for a resolved site.
 */
export class PermissionsService {
  private readonly sp: SharePointRestService;
  private currentUserLoginPromise: Promise<string | undefined> | undefined;

  public constructor(sp: SharePointRestService) {
    this.sp = sp;
  }

  /**
   * Resolves the current user's LoginName via /_api/web/currentuser and caches
   * the promise on the instance. Returns undefined when the call fails so that
   * callers can treat the result as "no exclusion possible" without throwing.
   */
  private getCurrentUserLoginName(site: IResolvedSite): Promise<string | undefined> {
    if (this.currentUserLoginPromise === undefined) {
      this.currentUserLoginPromise = (async () => {
        try {
          const url = this.sp.ensureAbsolute(site.webUrl, '/_api/web/currentuser?$select=LoginName');
          const raw = await this.sp.getJson<{ LoginName?: string }>(url);
          return typeof raw?.LoginName === 'string' && raw.LoginName.length > 0 ? raw.LoginName : undefined;
        } catch {
          return undefined;
        }
      })();
    }
    return this.currentUserLoginPromise;
  }

  /**
   * Returns a lightweight summary of the site's permissions. If entries are
   * already known they can be supplied to avoid a second network call.
   */
  public async getSummary(site: IResolvedSite, entries?: IPermissionEntry[]): Promise<IPermissionsSummary> {
    const resolvedEntries = entries ?? await this.getPermissions(site);

    let userCount = 0;
    let groupCount = 0;
    let m365GroupCount = 0;
    let externalUserCount = 0;
    for (const entry of resolvedEntries) {
      if (entry.isExternal === true) {
        externalUserCount += 1;
      }
      switch (entry.principalType) {
        case 'User':
          userCount += 1;
          break;
        case 'SharePointGroup':
          groupCount += 1;
          break;
        case 'Microsoft365Group':
          m365GroupCount += 1;
          break;
        default:
          // ExternalUser is already counted above; SecurityGroup / Unknown are
          // not tallied into the named buckets by design.
          break;
      }
    }

    return {
      title: site.title,
      webUrl: site.webUrl,
      totalPrincipals: resolvedEntries.length,
      userCount,
      groupCount,
      m365GroupCount,
      externalUserCount
    };
  }

  /**
   * Loads the site's role assignments and maps each to an IPermissionEntry.
   * Entries whose only permission level was "Limited Access" retain the
   * label so the UI can still surface them.
   *
   * The internal "Limited Access System Group" principal is excluded from the
   * results, and the current user's own direct Limited-Access-only entry is
   * also excluded, mirroring how SharePoint's own permissions UI hides them.
   */
  public async getPermissions(site: IResolvedSite): Promise<IPermissionEntry[]> {
    const select = [
      'PrincipalId',
      'Member/Title',
      'Member/LoginName',
      'Member/PrincipalType',
      'Member/Email',
      'RoleDefinitionBindings/Name',
      'RoleDefinitionBindings/Hidden'
    ].join(',');
    const path = `/_api/web/roleassignments?$expand=Member,RoleDefinitionBindings&$select=${select}`;
    const url = this.sp.ensureAbsolute(site.webUrl, path);

    const raw = await this.sp.getJson<ISpCollection<ISpRoleAssignmentRaw>>(url);
    const assignments = Array.isArray(raw?.value) ? raw.value : [];

    const entries: IPermissionEntry[] = [];
    const ignoredLower = IGNORED_PERMISSION_LEVELS.map((l) => l.toLowerCase());
    const currentUserLoginLower = ((await this.getCurrentUserLoginName(site)) ?? '').toLowerCase();

    for (const assignment of assignments) {
      const principalId = typeof assignment.PrincipalId === 'number' ? assignment.PrincipalId : undefined;
      const member = assignment.Member ?? {};
      const loginName = member.LoginName;
      const email = member.Email;
      const spPrincipalType = typeof member.PrincipalType === 'number' ? member.PrincipalType : 0;
      const principalType = mapSpPrincipalType(spPrincipalType, loginName);

      const bindings = Array.isArray(assignment.RoleDefinitionBindings) ? assignment.RoleDefinitionBindings : [];
      const allNames: string[] = [];
      for (const b of bindings) {
        if (typeof b?.Name === 'string' && b.Name.length > 0) {
          allNames.push(b.Name);
        }
      }
      const filtered = allNames.filter((n) => ignoredLower.indexOf(n.toLowerCase()) < 0);
      const isLimitedAccessOnly = filtered.length === 0;
      const permissionLevels = isLimitedAccessOnly ? ['Limited Access'] : filtered;

      const source =
        principalType === 'SharePointGroup'
          ? 'SharePointGroup'
          : principalType === 'Microsoft365Group'
            ? 'Microsoft365Group'
            : 'Direct';

      // Exclude SharePoint's internal "Limited Access System Group" plumbing
      // principal; it cannot be removed and is hidden by the native UI.
      if (isLimitedAccessSystemPrincipal(member.Title)) {
        continue;
      }

      // Exclude the current user's own direct Limited-Access-only entry, which
      // SharePoint synthesizes and does not surface in its own permissions UI.
      if (
        isLimitedAccessOnly &&
        source === 'Direct' &&
        currentUserLoginLower.length > 0 &&
        (loginName ?? '').toLowerCase() === currentUserLoginLower
      ) {
        continue;
      }

      entries.push({
        id: principalId !== undefined ? String(principalId) : `${loginName ?? 'unknown'}`,
        principalId,
        displayName: member.Title ?? '',
        loginName,
        email,
        principalType,
        permissionLevels,
        source,
        isExternal: isExternalUser(loginName, email),
        isGroupExpandable: principalType === 'SharePointGroup'
      });
    }

    return entries;
  }

  /**
   * Expands a SharePoint group and returns its member users. Throws HttpError(403)
   * when the current user does not have permission to enumerate the group.
   */
  public async expandGroup(site: IResolvedSite, principalId: number): Promise<IPermissionEntry[]> {
    const path = `/_api/web/sitegroups/getbyid(${principalId})/users?$select=Id,Title,LoginName,PrincipalType,Email`;
    const url = this.sp.ensureAbsolute(site.webUrl, path);

    try {
      const raw = await this.sp.getJson<ISpCollection<ISpUserRaw>>(url);
      const users = Array.isArray(raw?.value) ? raw.value : [];
      const members: IPermissionEntry[] = [];
      for (const u of users) {
        const loginName = u.LoginName;
        const email = u.Email;
        const spPrincipalType = typeof u.PrincipalType === 'number' ? u.PrincipalType : 0;
        const principalType = mapSpPrincipalType(spPrincipalType, loginName);
        members.push({
          id: `${principalId}:${loginName ?? u.Title ?? ''}`,
          principalId: typeof u.Id === 'number' ? u.Id : undefined,
          displayName: u.Title ?? '',
          loginName,
          email,
          principalType,
          permissionLevels: [],
          source: 'SharePointGroup',
          isExternal: isExternalUser(loginName, email),
          isGroupExpandable: false
        });
      }
      return members;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 403 || status === 401) {
        throw new HttpError('Group members are not accessible to the current user', 403);
      }
      throw err;
    }
  }
}
