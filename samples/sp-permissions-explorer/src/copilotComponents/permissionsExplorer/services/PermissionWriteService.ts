import { IResolvedSite } from '../models/IResolvedSite';
import { IPermissionEntry } from '../models/IPermissionEntry';
import {
  IRoleDefinitionInfo,
  IManageCapability,
  IWriteActionResult
} from '../models/IWriteAction';
import { SharePointRestService } from './SharePointRestService';
import { canManagePermissions, IBasePermissions } from '../utils/basePermissions';
import { IGNORED_PERMISSION_LEVELS } from '../utils/permissionLevels';

interface ISpRoleDefRaw {
  Id?: number;
  Name?: string;
  Hidden?: boolean;
}

interface ISpCollection<T> {
  value: T[];
}

interface ISpEnsureUserRaw {
  Id?: number;
  LoginName?: string;
  Title?: string;
}

/**
 * Error carrying a user-safe message that can be surfaced directly in the UI.
 * Used for validation/precondition failures (never for transport internals).
 */
export class WriteActionError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'WriteActionError';
  }
}

/**
 * Performs confirmed SharePoint permission write operations using the
 * SharePoint REST API only. Every public operation returns an IWriteActionResult
 * and never throws for expected authorization failures — 401/403 are mapped to
 * a friendly 'accessDenied' result so the UI can stay usable in read-only mode.
 */
export class PermissionWriteService {
  private readonly sp: SharePointRestService;

  public constructor(sp: SharePointRestService) {
    this.sp = sp;
  }

  /**
   * Determines whether the current user can manage permissions on the site by
   * reading effective base permissions. Returns determined=false on failure.
   */
  public async getCapabilities(site: IResolvedSite): Promise<IManageCapability> {
    try {
      const url = this.sp.ensureAbsolute(site.webUrl, '/_api/web/effectivebasepermissions');
      const raw = await this.sp.getJson<{ High?: number | string; Low?: number | string }>(url);
      const perms: IBasePermissions = {
        High: Number(raw?.High ?? 0),
        Low: Number(raw?.Low ?? 0)
      };
      return { canManagePermissions: canManagePermissions(perms), determined: true };
    } catch {
      return { canManagePermissions: false, determined: false };
    }
  }

  /**
   * Returns the site's role definitions (permission levels) with their Ids.
   */
  public async getRoleDefinitions(site: IResolvedSite): Promise<IRoleDefinitionInfo[]> {
    const url = this.sp.ensureAbsolute(site.webUrl, '/_api/web/roledefinitions?$select=Id,Name,Hidden');
    const raw = await this.sp.getJson<ISpCollection<ISpRoleDefRaw>>(url);
    const list = Array.isArray(raw?.value) ? raw.value : [];
    const out: IRoleDefinitionInfo[] = [];
    for (const r of list) {
      if (typeof r.Id === 'number' && typeof r.Name === 'string' && r.Name.length > 0) {
        out.push({ id: r.Id, name: r.Name, hidden: r.Hidden === true });
      }
    }
    return out;
  }

  /**
   * Grants a direct permission level to a user/group resolved from a login
   * name, email, or UPN.
   */
  public async grantAccess(
    site: IResolvedSite,
    loginName: string,
    roleName: string
  ): Promise<IWriteActionResult> {
    return this.execute(async () => {
      const principalId = await this.ensureUser(site, loginName);
      const roleDefId = await this.resolveRoleDefId(site, roleName);
      const path = `/_api/web/roleassignments/addroleassignment(principalid=${principalId},roledefid=${roleDefId})`;
      await this.sp.post(this.sp.ensureAbsolute(site.webUrl, path));
      return `Granted "${roleName}" to ${loginName}.`;
    });
  }

  /**
   * Removes all direct (non-Limited Access) permission levels from a principal.
   */
  public async removeAccess(site: IResolvedSite, entry: IPermissionEntry): Promise<IWriteActionResult> {
    return this.execute(async () => {
      const principalId = entry.principalId;
      if (typeof principalId !== 'number') {
        throw new WriteActionError('This principal cannot be resolved for removal.');
      }
      const roleDefIds = await this.resolveEntryRoleDefIds(site, entry);
      if (roleDefIds.length === 0) {
        throw new WriteActionError('There are no direct permission levels to remove for this principal.');
      }
      for (const roleDefId of roleDefIds) {
        const path = `/_api/web/roleassignments/removeroleassignment(principalid=${principalId},roledefid=${roleDefId})`;
        await this.sp.post(this.sp.ensureAbsolute(site.webUrl, path));
      }
      return `Removed direct access for ${entry.displayName}.`;
    });
  }

  /**
   * Changes a principal's direct permission level from one role to another.
   */
  public async changePermissionLevel(
    site: IResolvedSite,
    entry: IPermissionEntry,
    fromRoleName: string,
    toRoleName: string
  ): Promise<IWriteActionResult> {
    return this.execute(async () => {
      const principalId = entry.principalId;
      if (typeof principalId !== 'number') {
        throw new WriteActionError('This principal cannot be resolved for a permission change.');
      }
      const fromId = await this.resolveRoleDefId(site, fromRoleName);
      const toId = await this.resolveRoleDefId(site, toRoleName);
      const addPath = `/_api/web/roleassignments/addroleassignment(principalid=${principalId},roledefid=${toId})`;
      await this.sp.post(this.sp.ensureAbsolute(site.webUrl, addPath));
      const removePath = `/_api/web/roleassignments/removeroleassignment(principalid=${principalId},roledefid=${fromId})`;
      await this.sp.post(this.sp.ensureAbsolute(site.webUrl, removePath));
      return `Changed ${entry.displayName} from "${fromRoleName}" to "${toRoleName}".`;
    });
  }

  /**
   * Adds a user (resolved from a login name/email/UPN) to a SharePoint group.
   */
  public async addUserToGroup(
    site: IResolvedSite,
    groupPrincipalId: number,
    loginName: string
  ): Promise<IWriteActionResult> {
    return this.execute(async () => {
      const trimmed = (loginName ?? '').trim();
      if (trimmed.length === 0) {
        throw new WriteActionError('Enter a user name, email, or UPN.');
      }
      const ensureUrl = this.sp.ensureAbsolute(site.webUrl, '/_api/web/ensureuser');
      const ensured = await this.sp.postJson<ISpEnsureUserRaw>(ensureUrl, { logonName: trimmed });
      if (typeof ensured?.LoginName !== 'string' || ensured.LoginName.length === 0) {
        throw new WriteActionError(`Could not resolve "${trimmed}" to a user or group.`);
      }
      const path = `/_api/web/sitegroups/getbyid(${groupPrincipalId})/users`;
      await this.sp.post(this.sp.ensureAbsolute(site.webUrl, path), { LoginName: ensured.LoginName });
      return `Added ${ensured.Title ?? trimmed} to the group.`;
    });
  }

  /**
   * Removes a user from a SharePoint group by the user's principal Id.
   */
  public async removeUserFromGroup(
    site: IResolvedSite,
    groupPrincipalId: number,
    userPrincipalId: number
  ): Promise<IWriteActionResult> {
    return this.execute(async () => {
      const path = `/_api/web/sitegroups/getbyid(${groupPrincipalId})/users/removebyid(${userPrincipalId})`;
      await this.sp.post(this.sp.ensureAbsolute(site.webUrl, path));
      return 'Removed the member from the group.';
    });
  }

  /**
   * Ensures a user exists on the site and returns the principal Id.
   */
  private async ensureUser(site: IResolvedSite, loginName: string): Promise<number> {
    const trimmed = (loginName ?? '').trim();
    if (trimmed.length === 0) {
      throw new WriteActionError('Enter a user name, email, or UPN.');
    }
    const url = this.sp.ensureAbsolute(site.webUrl, '/_api/web/ensureuser');
    const raw = await this.sp.postJson<ISpEnsureUserRaw>(url, { logonName: trimmed });
    if (typeof raw?.Id !== 'number') {
      throw new WriteActionError(`Could not resolve "${trimmed}" to a user or group.`);
    }
    return raw.Id;
  }

  /**
   * Resolves a permission level name to a role definition Id.
   */
  private async resolveRoleDefId(site: IResolvedSite, roleName: string): Promise<number> {
    const wanted = (roleName ?? '').trim().toLowerCase();
    if (wanted.length === 0) {
      throw new WriteActionError('Select a permission level.');
    }
    const defs = await this.getRoleDefinitions(site);
    const match = defs.find((d) => d.name.toLowerCase() === wanted);
    if (!match) {
      throw new WriteActionError(`Permission level "${roleName}" was not found on this site.`);
    }
    return match.id;
  }

  /**
   * Maps an entry's displayed permission level names to role definition Ids,
   * ignoring Limited Access placeholders.
   */
  private async resolveEntryRoleDefIds(site: IResolvedSite, entry: IPermissionEntry): Promise<number[]> {
    const ignored = IGNORED_PERMISSION_LEVELS.map((l) => l.toLowerCase());
    const wanted = entry.permissionLevels
      .map((n) => n.toLowerCase())
      .filter((n) => ignored.indexOf(n) < 0);
    if (wanted.length === 0) {
      return [];
    }
    const defs = await this.getRoleDefinitions(site);
    const ids: number[] = [];
    for (const d of defs) {
      if (wanted.indexOf(d.name.toLowerCase()) >= 0) {
        ids.push(d.id);
      }
    }
    return ids;
  }

  /**
   * Runs a write operation and normalizes the outcome into IWriteActionResult.
   * 401/403 -> accessDenied; WriteActionError -> its user-safe message;
   * anything else -> a generic message (no transport internals exposed).
   */
  private async execute(op: () => Promise<string>): Promise<IWriteActionResult> {
    try {
      const message = await op();
      return { status: 'success', message };
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 401 || status === 403) {
        return {
          status: 'accessDenied',
          message: 'You do not have permission to perform this change on this site.'
        };
      }
      if (err instanceof WriteActionError) {
        return { status: 'error', message: err.message };
      }
      return {
        status: 'error',
        message: 'The change could not be completed. Please try again.'
      };
    }
  }
}
