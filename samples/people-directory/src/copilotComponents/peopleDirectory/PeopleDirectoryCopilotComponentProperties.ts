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

const propertiesSchema = z.object({
  message: z.string().describe('A message to display.'),
  inputQuery: z
    .string()
    .describe(
      'REQUIRED. The exact name or search term to look up in the people directory, ' +
      "extracted from the user's request — for example, from 'find me Dharati Patel' " +
      "extract 'Dharati Patel'; from 'who is the manager of the finance team' extract " +
      "'finance team manager'. Pass ONLY the extracted term itself, with no extra words " +
      "like 'find' or 'search for'. If the user did not name a specific person or search " +
      "term (e.g. 'open the people directory'), pass an empty string \"\" — never omit " +
      'this parameter.'
    )
});

export type IPeopleDirectoryCopilotComponentProperties = z.infer<typeof propertiesSchema>;

export default zodToJsonSchema(propertiesSchema);
