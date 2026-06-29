import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

/**
 * All authored properties are exposed as plain strings so the host can supply them
 * uniformly. Non-string values (booleans, enums) are encoded as strings here and parsed
 * back into their real types by the application (see ./propertyParsers.ts).
 */
const propertiesSchema = z.object({
  message: z
    .string()
    .default('Show me today\'s store performance for Seattle.')
    .describe('A prompt message to display.'),
  useMock: z
    .string()
    .default('true')
    .describe('Switch between mock data and real data service mode. Accepts "true" or "false".'),
  dataServiceUrl: z
    .string()
    .optional()
    .describe('URL of the data service when useMock is "false".'),
  theme: z
    .string()
    .default('light')
    .describe('Theme mode for the retail dashboard UI. Accepts "light" or "dark".')
}).superRefine((properties, context) => {
  const mockEnabled = (properties.useMock ?? 'true').trim().toLowerCase() !== 'false';
  if (!mockEnabled && !properties.dataServiceUrl) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dataServiceUrl'],
      message: 'dataServiceUrl is required when useMock is "false".'
    });
  }
});

export type IZavaRetailCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
