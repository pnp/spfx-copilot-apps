// Tool input schema for the Time-Off overview.
//
// One tool lands on this component (Pattern B: one tool per component), so there
// is no need to discriminate by property shape — both inputs are optional and
// the no-arg invocation ({}) renders the full overview.
//
// The default export is the JSON schema (consumed by the manifest); the named
// type is the strongly-typed shape handed to the component as `this.properties`.

import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  leaveType: z
    .enum(['vacation', 'sick', 'personal'])
    .optional()
    .describe(
      'Optional. When the user asked about a specific kind of leave, pass it ' +
        'here to highlight that balance: vacation, sick, or personal.'
    ),
  asOfDate: z
    .string()
    .optional()
    .describe(
      'Optional ISO date (yyyy-mm-dd) the user is asking about, e.g. "how ' +
        'much vacation will I have left by 2026-07-01". Reserved for future ' +
        'projections; the overview currently renders current balances.'
    )
});

export type ITimeOffOverviewCopilotComponentProperties = z.infer<
  typeof propertiesSchema
>;

export default zodToJsonSchema(propertiesSchema);
