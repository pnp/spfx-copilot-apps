import * as React from 'react';
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, DialogActions, Button, Body1 } from '@fluentui/react-components';
/**
 * There is no documented Microsoft Graph endpoint to trigger a reassignment
 * of an approval item — `approvalItemRequest.isReassigned`/`reassignedFrom`
 * are read-only status fields, not an action. This dialog surfaces that
 * limitation instead of presenting a picker with no backing action.
 */
export default function ReassignDialog(props) {
    var open = props.open, onOpenChange = props.onOpenChange, approvalDisplayName = props.approvalDisplayName, strings = props.strings;
    return (React.createElement(Dialog, { open: open, onOpenChange: function (_event, data) { return onOpenChange(data.open); } },
        React.createElement(DialogSurface, null,
            React.createElement(DialogBody, null,
                React.createElement(DialogTitle, null, strings.ReassignDialogTitle),
                React.createElement(DialogContent, null,
                    React.createElement(Body1, null, strings.ReassignNotSupportedMessage.replace('{0}', approvalDisplayName))),
                React.createElement(DialogActions, null,
                    React.createElement(Button, { appearance: "primary", onClick: function () { return onOpenChange(false); } }, strings.CloseButtonLabel))))));
}
//# sourceMappingURL=ReassignDialog.js.map