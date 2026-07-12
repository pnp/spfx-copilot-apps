"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ApprovalListItem;
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var react_components_1 = require("@fluentui/react-components");
var react_icons_1 = require("@fluentui/react-icons");
var ReassignDialog_1 = tslib_1.__importDefault(require("./ReassignDialog"));
var ContactRequesterDialog_1 = tslib_1.__importDefault(require("./ContactRequesterDialog"));
function statusBadgeColor(state) {
    switch (state) {
        case 'completed':
            return 'success';
        case 'canceled':
            return 'danger';
        case 'created':
            return 'informative';
        case 'pending':
        default:
            return 'warning';
    }
}
function statusLabel(state, strings) {
    switch (state) {
        case 'completed':
            return strings.StatusCompletedLabel;
        case 'canceled':
            return strings.StatusCanceledLabel;
        case 'created':
            return strings.StatusCreatedLabel;
        case 'pending':
        default:
            return strings.StatusPendingLabel;
    }
}
var useStyles = (0, react_components_1.makeStyles)({
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: react_components_1.tokens.spacingHorizontalM,
        padding: react_components_1.tokens.spacingVerticalS,
        borderRadius: react_components_1.tokens.borderRadiusMedium,
        cursor: 'default',
        transitionProperty: 'transform, box-shadow, background-color',
        transitionDuration: react_components_1.tokens.durationNormal,
        transitionTimingFunction: react_components_1.tokens.curveEasyEase,
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: react_components_1.tokens.shadow8,
            backgroundColor: react_components_1.tokens.colorNeutralBackground1Hover
        }
    },
    rowInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalXXS,
        minWidth: 0
    },
    rowMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: react_components_1.tokens.spacingHorizontalXS,
        color: react_components_1.tokens.colorNeutralForeground3
    },
    rowActions: {
        display: 'flex',
        gap: react_components_1.tokens.spacingHorizontalXS,
        flexShrink: 0
    },
    alternate: {
        backgroundColor: react_components_1.tokens.colorNeutralBackground2
    },
    card: {
        transitionProperty: 'transform, box-shadow',
        transitionDuration: react_components_1.tokens.durationNormal,
        transitionTimingFunction: react_components_1.tokens.curveEasyEase,
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: react_components_1.tokens.shadow16
        }
    },
    cardBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalS,
        padding: react_components_1.tokens.spacingHorizontalM
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: react_components_1.tokens.spacingHorizontalL,
        padding: react_components_1.tokens.spacingHorizontalM
    },
    detailIdentity: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: react_components_1.tokens.spacingHorizontalM,
        minWidth: 0
    },
    detailIdentityText: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalXXS,
        minWidth: 0
    },
    detailHeaderActions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: react_components_1.tokens.spacingVerticalS,
        flexShrink: 0
    },
    detailBadges: {
        display: 'flex',
        gap: react_components_1.tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    requesterInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: react_components_1.tokens.spacingVerticalXXS
    },
    requesterCaption: {
        color: react_components_1.tokens.colorNeutralForeground3
    },
    detailActions: {
        display: 'flex',
        gap: react_components_1.tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    errorText: {
        color: react_components_1.tokens.colorPaletteRedForeground1
    }
});
function getIdentityDisplayName(identity) {
    var _a, _b;
    return ((_a = identity === null || identity === void 0 ? void 0 : identity.user) === null || _a === void 0 ? void 0 : _a.displayName) || ((_b = identity === null || identity === void 0 ? void 0 : identity.group) === null || _b === void 0 ? void 0 : _b.displayName);
}
function formatDateTime(value) {
    if (!value) {
        return undefined;
    }
    var parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toLocaleString();
}
var URL_SPLIT_PATTERN = /(https?:\/\/[^\s]+)/g;
var URL_TEST_PATTERN = /^https?:\/\//;
/**
 * Renders free text with any http(s) URLs turned into clickable Links,
 * routed through onOpenLink (the Copilot host bridge) instead of native
 * navigation, since this renders inside a sandboxed Copilot iframe.
 */
function renderTextWithLinks(text, onOpenLink) {
    return text.split(URL_SPLIT_PATTERN).map(function (part, index) {
        return URL_TEST_PATTERN.test(part) ? (React.createElement(react_components_1.Link, { key: index, href: part, target: "_blank", rel: "noopener noreferrer", onClick: function (event) {
                event.preventDefault();
                onOpenLink(part);
            } }, part)) : (part);
    });
}
/**
 * Renders a single pending approval, either as a compact row (inline
 * display mode) or a detailed card (fullscreen display mode), with
 * Approve/Reject/Re-assign actions.
 */
function ApprovalListItem(props) {
    var _this = this;
    var _a, _b, _c, _d, _e, _f;
    var approval = props.approval, variant = props.variant, onApprove = props.onApprove, onReject = props.onReject, onContactRequester = props.onContactRequester, onOpenLink = props.onOpenLink, isAlternate = props.isAlternate, strings = props.strings;
    var styles = useStyles();
    var _g = React.useState(undefined), busyAction = _g[0], setBusyAction = _g[1];
    var _h = React.useState(undefined), errorMessage = _h[0], setErrorMessage = _h[1];
    var _j = React.useState(false), isReassignDialogOpen = _j[0], setIsReassignDialogOpen = _j[1];
    var _k = React.useState(false), isContactDialogOpen = _k[0], setIsContactDialogOpen = _k[1];
    var ownerName = getIdentityDisplayName(approval.owner);
    var createdDateTime = formatDateTime(approval.createdDateTime);
    var isPending = approval.state === 'pending';
    var requesterName = (_b = (_a = approval.ownerUser) === null || _a === void 0 ? void 0 : _a.displayName) !== null && _b !== void 0 ? _b : ownerName;
    var requesterMail = (_d = (_c = approval.ownerUser) === null || _c === void 0 ? void 0 : _c.mail) !== null && _d !== void 0 ? _d : (_e = approval.ownerUser) === null || _e === void 0 ? void 0 : _e.userPrincipalName;
    var handleApprove = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setErrorMessage(undefined);
                    setBusyAction('approve');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onApprove(approval)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    setErrorMessage(strings.ApproveErrorMessage);
                    return [3 /*break*/, 5];
                case 4:
                    setBusyAction(undefined);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [approval, onApprove, strings]);
    var handleReject = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        var _a;
        return tslib_1.__generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setErrorMessage(undefined);
                    setBusyAction('reject');
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, onReject(approval)];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 5];
                case 3:
                    _a = _b.sent();
                    setErrorMessage(strings.RejectErrorMessage);
                    return [3 /*break*/, 5];
                case 4:
                    setBusyAction(undefined);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [approval, onReject, strings]);
    var handleOpenLink = React.useCallback(function (url) {
        onOpenLink(url);
    }, [onOpenLink]);
    var isBusy = busyAction !== undefined;
    var approveIcon = busyAction === 'approve'
        ? React.createElement(react_components_1.Spinner, { size: "tiny" })
        : React.createElement(react_icons_1.CheckmarkCircleRegular, null);
    var rejectIcon = busyAction === 'reject'
        ? React.createElement(react_components_1.Spinner, { size: "tiny" })
        : React.createElement(react_icons_1.DismissCircleRegular, null);
    if (variant === 'compact') {
        return (React.createElement("div", { className: (0, react_components_1.mergeClasses)(styles.row, isAlternate && styles.alternate) },
            React.createElement("div", { className: styles.rowInfo },
                React.createElement(react_components_1.Body1Strong, null, approval.displayName),
                React.createElement("div", { className: styles.rowMeta },
                    ownerName && (React.createElement(React.Fragment, null,
                        React.createElement(react_icons_1.PersonRegular, { fontSize: 16 }),
                        React.createElement(react_components_1.Caption1, null, ownerName))),
                    createdDateTime && (React.createElement(React.Fragment, null,
                        React.createElement(react_icons_1.CalendarRegular, { fontSize: 16 }),
                        React.createElement(react_components_1.Caption1, null, createdDateTime)))),
                errorMessage && React.createElement(react_components_1.Caption1, { className: styles.errorText }, errorMessage)),
            isPending && (React.createElement("div", { className: styles.rowActions },
                React.createElement(react_components_1.Tooltip, { content: strings.ApproveButtonLabel, relationship: "label" },
                    React.createElement(react_components_1.Button, { appearance: "subtle", icon: approveIcon, disabled: isBusy, onClick: handleApprove, "aria-label": strings.ApproveButtonLabel })),
                React.createElement(react_components_1.Tooltip, { content: strings.RejectButtonLabel, relationship: "label" },
                    React.createElement(react_components_1.Button, { appearance: "subtle", icon: rejectIcon, disabled: isBusy, onClick: handleReject, "aria-label": strings.RejectButtonLabel })),
                React.createElement(react_components_1.Tooltip, { content: strings.ReassignButtonLabel, relationship: "label" },
                    React.createElement(react_components_1.Button, { appearance: "subtle", icon: React.createElement(react_icons_1.PersonArrowRightRegular, null), disabled: isBusy, onClick: function () { return setIsReassignDialogOpen(true); }, "aria-label": strings.ReassignButtonLabel })))),
            React.createElement(ReassignDialog_1.default, { open: isReassignDialogOpen, onOpenChange: setIsReassignDialogOpen, approvalDisplayName: approval.displayName, strings: strings })));
    }
    var approverNames = (approval.approvers || [])
        .map(getIdentityDisplayName)
        .filter(function (name) { return Boolean(name); });
    var reassignedRequest = approval.currentUserRequests.find(function (request) { return request.isReassigned; });
    var reassignedFromName = getIdentityDisplayName(reassignedRequest === null || reassignedRequest === void 0 ? void 0 : reassignedRequest.reassignedFrom);
    return (React.createElement(react_components_1.Card, { className: (0, react_components_1.mergeClasses)(styles.card, isAlternate && styles.alternate) },
        React.createElement("div", { className: styles.detailRow },
            React.createElement("div", { className: styles.detailIdentity },
                requesterName && (React.createElement(react_components_1.Avatar, { name: requesterName, image: ((_f = approval.ownerUser) === null || _f === void 0 ? void 0 : _f.photoDataUrl) ? { src: approval.ownerUser.photoDataUrl } : undefined, size: 40 })),
                React.createElement("div", { className: styles.detailIdentityText },
                    React.createElement(react_components_1.Body1Strong, null, approval.displayName),
                    approval.description && (React.createElement(react_components_1.Body1, null, renderTextWithLinks(approval.description, handleOpenLink))),
                    requesterName && (React.createElement("div", { className: styles.requesterInfo },
                        React.createElement(react_components_1.Caption1, { className: styles.requesterCaption },
                            strings.RequestedByLabel,
                            " ",
                            requesterName),
                        requesterMail && (React.createElement(react_components_1.Button, { appearance: "transparent", size: "small", icon: React.createElement(react_icons_1.MailRegular, null), onClick: function () { return setIsContactDialogOpen(true); } }, strings.ContactRequesterButtonLabel)))))),
            React.createElement("div", { className: styles.detailHeaderActions },
                React.createElement("div", { className: styles.detailBadges },
                    React.createElement(react_components_1.Badge, { appearance: "filled", color: statusBadgeColor(approval.state) }, statusLabel(approval.state, strings)),
                    approval.approvalType && (React.createElement(react_components_1.Badge, { appearance: "outline" },
                        strings.ApprovalTypeLabel,
                        " ",
                        approval.approvalType)),
                    createdDateTime && (React.createElement(react_components_1.Badge, { appearance: "outline", icon: React.createElement(react_icons_1.CalendarRegular, null) },
                        strings.CreatedLabel,
                        " ",
                        createdDateTime)),
                    approverNames.length > 0 && (React.createElement(react_components_1.Badge, { appearance: "outline", icon: React.createElement(react_icons_1.PeopleRegular, null) }, approverNames.join(', '))),
                    reassignedFromName && (React.createElement(react_components_1.Badge, { appearance: "outline", color: "informative", icon: React.createElement(react_icons_1.PersonArrowRightRegular, null) }, reassignedFromName))),
                isPending && (React.createElement("div", { className: styles.detailActions },
                    React.createElement(react_components_1.Button, { appearance: "primary", icon: approveIcon, disabled: isBusy, onClick: handleApprove }, strings.ApproveButtonLabel),
                    React.createElement(react_components_1.Button, { appearance: "secondary", icon: rejectIcon, disabled: isBusy, onClick: handleReject }, strings.RejectButtonLabel),
                    React.createElement(react_components_1.Button, { appearance: "secondary", icon: React.createElement(react_icons_1.PersonArrowRightRegular, null), disabled: isBusy, onClick: function () { return setIsReassignDialogOpen(true); } }, strings.ReassignButtonLabel))))),
        errorMessage && (React.createElement("div", { className: styles.cardBody },
            React.createElement(react_components_1.Body1, { className: styles.errorText }, errorMessage))),
        React.createElement(ReassignDialog_1.default, { open: isReassignDialogOpen, onOpenChange: setIsReassignDialogOpen, approvalDisplayName: approval.displayName, strings: strings }),
        React.createElement(ContactRequesterDialog_1.default, { open: isContactDialogOpen, onOpenChange: setIsContactDialogOpen, approvalDisplayName: approval.displayName, requesterName: requesterName !== null && requesterName !== void 0 ? requesterName : '', onSend: function (subject, body) { return onContactRequester(approval, subject, body); }, strings: strings })));
}
//# sourceMappingURL=ApprovalListItem.js.map