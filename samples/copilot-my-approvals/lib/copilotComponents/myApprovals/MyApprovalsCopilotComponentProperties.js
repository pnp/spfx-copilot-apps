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
var propertiesSchema = z.object({
    message: z.string().describe('A message to display.')
});
export default zodToJsonSchema(propertiesSchema);
//# sourceMappingURL=MyApprovalsCopilotComponentProperties.js.map