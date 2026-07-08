/**
 * Properties schema for this Copilot Component.
 *
 * This schema is defined with Zod and exported as JSON Schema via
 * `zod-to-json-schema`. The manifest references the compiled `.js` default
 * export, which the Copilot host uses to validate and describe the tool
 * arguments that Copilot passes when invoking this component.
 *
 * To add more properties, extend the `z.object({...})` below — they will
 * automatically appear as tool parameters in the Copilot UI.
 */
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z
  .object({
    message: z
      .string()
      .optional()
      .describe('An optional greeting or context message shown with the dashboard.'),
    useMock: z
      .string()
      .default('true')
      .describe(
        'When "true" (default), the dashboard renders locally generated mock data and needs no backend. When "false", it reads live data from the endpoint configured in dataServiceUrl.'
      ),
    dataServiceUrl: z
      .string()
      .optional()
      .describe('Absolute URL of the REST endpoint that returns the dashboard payload. Required when useMock is "false".')
  })
  .superRefine((value, ctx) => {
    if (value.useMock?.toLowerCase() === 'false' && (!value.dataServiceUrl || value.dataServiceUrl.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dataServiceUrl'],
        message: 'dataServiceUrl is required when useMock is "false".'
      });
    }
  });

export type IExecDashboardCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
