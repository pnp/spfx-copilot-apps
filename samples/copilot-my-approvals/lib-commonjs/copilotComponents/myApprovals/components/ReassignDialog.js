"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReassignDialog;
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var react_components_1 = require("@fluentui/react-components");
/**
 * There is no documented Microsoft Graph endpoint to trigger a reassignment
 * of an approval item — `approvalItemRequest.isReassigned`/`reassignedFrom`
 * are read-only status fields, not an action. This dialog surfaces that
 * limitation instead of presenting a picker with no backing action.
 */
function ReassignDialog(props) {
    var open = props.open, onOpenChange = props.onOpenChange, approvalDisplayName = props.approvalDisplayName, strings = props.strings;
    return (React.createElement(react_components_1.Dialog, { open: open, onOpenChange: function (_event, data) { return onOpenChange(data.open); } },
        React.createElement(react_components_1.DialogSurface, null,
            React.createElement(react_components_1.DialogBody, null,
                React.createElement(react_components_1.DialogTitle, null, strings.ReassignDialogTitle),
                React.createElement(react_components_1.DialogContent, null,
                    React.createElement(react_components_1.Body1, null, strings.ReassignNotSupportedMessage.replace('{0}', approvalDisplayName))),
                React.createElement(react_components_1.DialogActions, null,
                    React.createElement(react_components_1.Button, { appearance: "primary", onClick: function () { return onOpenChange(false); } }, strings.CloseButtonLabel))))));
}
//# sourceMappingURL=ReassignDialog.js.map