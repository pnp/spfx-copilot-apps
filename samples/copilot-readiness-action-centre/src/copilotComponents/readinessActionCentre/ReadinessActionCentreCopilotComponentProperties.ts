import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

/**
 * Tool input schema (agentic-creation-rules §5).
 * Default export is JSON Schema for SPFx packaging into ai-plugin.json.
 * Only type / items / enum / description / default are safe for Teams validation.
 */
const propertiesSchema = z.object({
  assessmentId: z
    .number()
    .int()
    .optional()
    .describe('Optional SharePoint assessment item ID to open.'),
  severity: z
    .enum(['Critical', 'High', 'Medium', 'Low', 'All'])
    .optional()
    .describe('Optional initial severity filter.'),
  siteUrl: z
    .string()
    .optional()
    .describe('Optional SharePoint site URL containing the readiness lists.'),
  useMockData: z
    .boolean()
    .optional()
    .describe('Use built-in demonstration data instead of SharePoint lists.')
});

export type IReadinessActionCentreProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
