// Tool-call properties for the Time-Off Request Copilot Component.
//
// Authored as a zod schema (single source of truth) and emitted as JSON Schema
// for the SPFx manifest via zod-to-json-schema. Every field is optional: the
// tool can open an empty form, or Copilot can pre-fill any subset it extracted
// from the user's prompt (e.g. "book vacation July 6-10").

import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  leaveType: z
    .enum(['vacation', 'sick', 'personal'])
    .optional()
    .describe(
      'Optional kind of leave to pre-select: "vacation", "sick" or ' +
        '"personal". Maps to the leave-type selector in the request form.'
    ),
  startDate: z
    .string()
    .optional()
    .describe(
      'Optional ISO start date (yyyy-mm-dd), e.g. "2026-07-06". Pre-fills ' +
        'the start-date field.'
    ),
  endDate: z
    .string()
    .optional()
    .describe(
      'Optional ISO end date (yyyy-mm-dd), inclusive, e.g. "2026-07-10". ' +
        'Pre-fills the end-date field. Omit for a single-day request.'
    ),
  note: z
    .string()
    .optional()
    .describe(
      'Optional short note or reason for the request, e.g. "Family trip".'
    )
});

export type ITimeOffRequestCopilotComponentProperties = z.infer<
  typeof propertiesSchema
>;

export default zodToJsonSchema(propertiesSchema);
