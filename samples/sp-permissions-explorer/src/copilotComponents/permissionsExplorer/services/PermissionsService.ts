import { IResolvedSite } from '../models/IResolvedSite';
import { IPermissionEntry } from '../models/IPermissionEntry';
import { IPermissionsSummary } from '../models/IPermissionsSummary';
import { SharePointRestService } from './SharePointRestService';
import { mapSpPrincipalType } from '../utils/principalTypeMapper';
import { isExternalUser } from '../utils/externalUserDetector';
import { IGNORED_PERMISSION_LEVELS } from '../utils/permissionLevels';
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

interface ISpHasUniqueRaw {
  value?: boolean;
}

interface ISpUserRaw {
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

  public constructor(sp: SharePointRestService) {
    this.sp = sp;
  }

  /**
   * Returns a lightweight summary of the site's permissions. If entries are
   * already known they can be supplied to avoid a second network call.
   */
  public async getSummary(site: IResolvedSite, entries?: IPermissionEntry[]): Promise<IPermissionsSummary> {
    const resolvedEntries = entries ?? await this.getPermissions(site);

    let hasUnique: boolean | undefined;
    try {
      const url = this.sp.ensureAbsolute(site.webUrl, '/_api/web/hasuniqueroleassignments');
      const raw = await this.sp.getJson<ISpHasUniqueRaw>(url);
      hasUnique = typeof raw?.value === 'boolean' ? raw.value : undefined;
    } catch {
      hasUnique = undefined;
    }

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
      externalUserCount,
      hasUniquePermissions: hasUnique
    };
  }

  /**
   * Loads the site's role assignments and maps each to an IPermissionEntry.
   * Entries whose only permission level was "Limited Access" retain the
   * label so the UI can still surface them.
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
      let permissionLevels = allNames.filter((n) => ignoredLower.indexOf(n.toLowerCase()) < 0);

      // If filtering removed everything, keep a "Limited Access" placeholder
      // so the entry is still visible in the UI.
      if (permissionLevels.length === 0) {
        permissionLevels = ['Limited Access'];
      }

      const source =
        principalType === 'SharePointGroup'
          ? 'SharePointGroup'
          : principalType === 'Microsoft365Group'
            ? 'Microsoft365Group'
            : 'Direct';

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
    const path = `/_api/web/sitegroups/getbyid(${principalId})/users?$select=Title,LoginName,PrincipalType,Email`;
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
