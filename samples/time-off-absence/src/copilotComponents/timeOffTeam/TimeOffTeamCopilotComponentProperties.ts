// Tool input schema for the Time-Off team view (Component C).
//
// One tool lands on this component (Pattern B: one tool per component). All
// inputs are optional and a no-arg invocation ({}) renders the full team view —
// "who's out" plus, for a manager, the pending-approvals inbox.
//
// The default export is the JSON schema (consumed by the manifest); the named
// type is the strongly-typed shape handed to the component as `this.properties`.

import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const propertiesSchema = z.object({
  view: z
    .enum(['whosOut', 'approvals'])
    .optional()
    .describe(
      'Optional. Which section the user is asking for: "whosOut" for who is ' +
        'on leave, or "approvals" for requests waiting for the signed-in ' +
        'manager to approve. When omitted the component shows both.'
    ),
  startDate: z
    .string()
    .optional()
    .describe(
      'Optional ISO date (yyyy-mm-dd) marking the start of the window the user ' +
        'cares about, e.g. "who is out the week of 2026-07-06". Reserved for ' +
        'future range filtering; the view currently shows all upcoming absences.'
    ),
  endDate: z
    .string()
    .optional()
    .describe(
      'Optional ISO date (yyyy-mm-dd) marking the end of the window the user ' +
        'cares about. Reserved for future range filtering.'
    )
});

export type ITimeOffTeamCopilotComponentProperties = z.infer<
  typeof propertiesSchema
>;

export default zodToJsonSchema(propertiesSchema);
