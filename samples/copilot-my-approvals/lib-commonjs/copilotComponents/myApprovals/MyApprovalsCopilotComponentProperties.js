"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
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
var zod_1 = require("zod");
var zod_to_json_schema_1 = tslib_1.__importDefault(require("zod-to-json-schema"));
var propertiesSchema = zod_1.z.object({
    message: zod_1.z.string().describe('A message to display.')
});
exports.default = (0, zod_to_json_schema_1.default)(propertiesSchema);
//# sourceMappingURL=MyApprovalsCopilotComponentProperties.js.map