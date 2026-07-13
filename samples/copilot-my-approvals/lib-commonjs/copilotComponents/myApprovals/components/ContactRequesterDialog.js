"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ContactRequesterDialog;
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var react_components_1 = require("@fluentui/react-components");
var useStyles = (0, react_components_1.makeStyles)({
    content: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalM
    },
    errorText: {
        color: react_components_1.tokens.colorPaletteRedForeground1
    }
});
/**
 * Compose-and-send dialog for emailing an approval's requester, via
 * Microsoft Graph `/me/sendMail` (wired up by the caller's `onSend`).
 */
function ContactRequesterDialog(props) {
    var _this = this;
    var open = props.open, onOpenChange = props.onOpenChange, approvalDisplayName = props.approvalDisplayName, requesterName = props.requesterName, onSend = props.onSend, strings = props.strings;
    var styles = useStyles();
    var _a = React.useState(''), subject = _a[0], setSubject = _a[1];
    var _b = React.useState(''), body = _b[0], setBody = _b[1];
    var _c = React.useState(false), isSending = _c[0], setIsSending = _c[1];
    var _d = React.useState(undefined), errorMessage = _d[0], setErrorMessage = _d[1];
    // Reset the form each time the dialog is (re)opened, possibly for a
    // different approval.
    React.useEffect(function () {
        if (open) {
            setSubject(strings.ContactRequesterDefaultSubject.replace('{0}', approvalDisplayName));
            setBody('');
            setErrorMessage(undefined);
        }
    }, [open, approvalDisplayName, strings]);
    var handleSend = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setErrorMessage(undefined);
                    setIsSending(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onSend(subject, body)];
                case 2:
                    _b.sent();
                    onOpenChange(false);
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    setErrorMessage(strings.ContactRequesterErrorMessage);
                    return [3 /*break*/, 5];
                case 4:
                    setIsSending(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [onSend, subject, body, onOpenChange, strings]);
    return (React.createElement(react_components_1.Dialog, { open: open, onOpenChange: function (_event, data) { return onOpenChange(data.open); } },
        React.createElement(react_components_1.DialogSurface, null,
            React.createElement(react_components_1.DialogBody, null,
                React.createElement(react_components_1.DialogTitle, null, strings.ContactRequesterDialogTitle.replace('{0}', requesterName)),
                React.createElement(react_components_1.DialogContent, { className: styles.content },
                    React.createElement(react_components_1.Field, { label: strings.ContactRequesterSubjectLabel },
                        React.createElement(react_components_1.Input, { value: subject, onChange: function (_event, data) { return setSubject(data.value); }, disabled: isSending })),
                    React.createElement(react_components_1.Field, { label: strings.ContactRequesterMessageLabel },
                        React.createElement(react_components_1.Textarea, { value: body, onChange: function (_event, data) { return setBody(data.value); }, disabled: isSending, rows: 5 })),
                    errorMessage && React.createElement(react_components_1.Body1, { className: styles.errorText }, errorMessage)),
                React.createElement(react_components_1.DialogActions, null,
                    React.createElement(react_components_1.Button, { appearance: "secondary", onClick: function () { return onOpenChange(false); }, disabled: isSending }, strings.CancelButtonLabel),
                    React.createElement(react_components_1.Button, { appearance: "primary", onClick: handleSend, disabled: isSending || subject.trim().length === 0 }, isSending ? React.createElement(react_components_1.Spinner, { size: "tiny" }) : strings.SendButtonLabel))))));
}
//# sourceMappingURL=ContactRequesterDialog.js.map