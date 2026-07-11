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
      'Site title, partial title, or absolute URL of the SharePoint site to review. Extract from the user prompt, e.g. "EIB Architecture".'
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
      'directOnly',
      'inheritedOnly'
    ])
    .optional()
    .describe('Which subset of permissions to emphasise.'),
  principalQuery: z
    .string()
    .optional()
    .describe('Name, email or UPN of a person or group to look up, e.g. "Nicolas Lazzerini".'),
  includeGroups: z
    .boolean()
    .optional()
    .describe('Whether to include and allow expansion of groups.'),
  includeExternalUsers: z
    .boolean()
    .optional()
    .describe('Whether to emphasise external/guest users.'),
  includeInheritedPermissions: z
    .boolean()
    .optional()
    .describe('Whether to include inherited permissions.'),
  mode: z
    .enum(['summary', 'details', 'userLookup'])
    .optional()
    .describe('summary=overview, details=full table, userLookup=find a specific person.')
});

export type IPermissionsExplorerCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
