/**
 * Properties schema for this Copilot Component.
 *
 * This schema is defined with Zod and exported as JSON Schema via
 * `zod-to-json-schema`. The manifest references the compiled `.js` default
 * export, which the Copilot host uses to validate and describe the tool
 * arguments that Copilot passes when invoking this component.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  siteQuery: z
    .string()
    .default('')
    .describe(
      'Site title, partial title, or absolute URL of the SharePoint site to review. Extract from the user prompt, e.g. "Project Management".'
    ),
  siteUrl: z
    .string()
    .optional()
    .describe('Absolute site URL when the user provides one.'),
  filter: z
    .enum([
      'all',
      'users',
      'groups',
      'externalUsers',
      'fullControl',
      'edit',
      'read',
      'directOnly'
    ])
    .optional()
    .describe('Which subset of permissions to emphasise.'),
  principalQuery: z
    .string()
    .optional()
    .describe('Name, email or UPN of a person or group to look up, e.g. "Adele Vance".'),
  includeGroups: z
    .boolean()
    .optional()
    .describe('Whether to include and allow expansion of groups.'),
  includeExternalUsers: z
    .boolean()
    .optional()
    .describe('Whether to emphasise external/guest users.'),
  mode: z
    .enum(['summary', 'details', 'userLookup'])
    .optional()
    .describe('summary=overview, details=full table, userLookup=find a specific person.'),
  operation: z
    .enum([
      'review',
      'grantAccess',
      'removeAccess',
      'changePermissionLevel',
      'addToSharePointGroup',
      'removeFromSharePointGroup'
    ])
    .optional()
    .describe('Intended permission operation. Any write operation still requires explicit in-UI confirmation before it runs.'),
  sourcePermissionLevel: z
    .string()
    .optional()
    .describe('Current permission level to change from, e.g. "Edit".'),
  targetPermissionLevel: z
    .string()
    .optional()
    .describe('Permission level to grant or change to, e.g. "Read".'),
  targetGroupQuery: z
    .string()
    .optional()
    .describe('User (name/email/UPN) or target SharePoint group involved in the operation.'),
  requireConfirmation: z
    .boolean()
    .optional()
    .describe('Whether UI confirmation is required before executing a write action. Always treated as required.')
});

export type IPermissionsExplorerCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
