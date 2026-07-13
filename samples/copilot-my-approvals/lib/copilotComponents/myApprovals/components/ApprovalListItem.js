import { __awaiter, __generator } from "tslib";
import * as React from 'react';
import { Body1, Body1Strong, Caption1, Badge, Button, Card, Tooltip, Spinner, Avatar, Link, makeStyles, mergeClasses, tokens } from '@fluentui/react-components';
import { CheckmarkCircleRegular, DismissCircleRegular, PersonArrowRightRegular, CalendarRegular, PersonRegular, PeopleRegular, MailRegular } from '@fluentui/react-icons';
import ReassignDialog from './ReassignDialog';
import ContactRequesterDialog from './ContactRequesterDialog';
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
var useStyles = makeStyles({
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingVerticalS,
        borderRadius: tokens.borderRadiusMedium,
        cursor: 'default',
        transitionProperty: 'transform, box-shadow, background-color',
        transitionDuration: tokens.durationNormal,
        transitionTimingFunction: tokens.curveEasyEase,
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadow8,
            backgroundColor: tokens.colorNeutralBackground1Hover
        }
    },
    rowInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
        minWidth: 0
    },
    rowMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        color: tokens.colorNeutralForeground3
    },
    rowActions: {
        display: 'flex',
        gap: tokens.spacingHorizontalXS,
        flexShrink: 0
    },
    alternate: {
        backgroundColor: tokens.colorNeutralBackground2
    },
    card: {
        transitionProperty: 'transform, box-shadow',
        transitionDuration: tokens.durationNormal,
        transitionTimingFunction: tokens.curveEasyEase,
        ':hover': {
            transform: 'translateY(-2px)',
            boxShadow: tokens.shadow16
        }
    },
    cardBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS,
        padding: tokens.spacingHorizontalM
    },
    detailRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: tokens.spacingHorizontalL,
        padding: tokens.spacingHorizontalM
    },
    detailIdentity: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: tokens.spacingHorizontalM,
        minWidth: 0
    },
    detailIdentityText: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
        minWidth: 0
    },
    detailHeaderActions: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: tokens.spacingVerticalS,
        flexShrink: 0
    },
    detailBadges: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    requesterInfo: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: tokens.spacingVerticalXXS
    },
    requesterCaption: {
        color: tokens.colorNeutralForeground3
    },
    detailActions: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    errorText: {
        color: tokens.colorPaletteRedForeground1
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
        return URL_TEST_PATTERN.test(part) ? (React.createElement(Link, { key: index, href: part, target: "_blank", rel: "noopener noreferrer", onClick: function (event) {
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
export default function ApprovalListItem(props) {
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
    var handleApprove = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
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
    var handleReject = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
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
        ? React.createElement(Spinner, { size: "tiny" })
        : React.createElement(CheckmarkCircleRegular, null);
    var rejectIcon = busyAction === 'reject'
        ? React.createElement(Spinner, { size: "tiny" })
        : React.createElement(DismissCircleRegular, null);
    if (variant === 'compact') {
        return (React.createElement("div", { className: mergeClasses(styles.row, isAlternate && styles.alternate) },
            React.createElement("div", { className: styles.rowInfo },
                React.createElement(Body1Strong, null, approval.displayName),
                React.createElement("div", { className: styles.rowMeta },
                    ownerName && (React.createElement(React.Fragment, null,
                        React.createElement(PersonRegular, { fontSize: 16 }),
                        React.createElement(Caption1, null, ownerName))),
                    createdDateTime && (React.createElement(React.Fragment, null,
                        React.createElement(CalendarRegular, { fontSize: 16 }),
                        React.createElement(Caption1, null, createdDateTime)))),
                errorMessage && React.createElement(Caption1, { className: styles.errorText }, errorMessage)),
            isPending && (React.createElement("div", { className: styles.rowActions },
                React.createElement(Tooltip, { content: strings.ApproveButtonLabel, relationship: "label" },
                    React.createElement(Button, { appearance: "subtle", icon: approveIcon, disabled: isBusy, onClick: handleApprove, "aria-label": strings.ApproveButtonLabel })),
                React.createElement(Tooltip, { content: strings.RejectButtonLabel, relationship: "label" },
                    React.createElement(Button, { appearance: "subtle", icon: rejectIcon, disabled: isBusy, onClick: handleReject, "aria-label": strings.RejectButtonLabel })),
                React.createElement(Tooltip, { content: strings.ReassignButtonLabel, relationship: "label" },
                    React.createElement(Button, { appearance: "subtle", icon: React.createElement(PersonArrowRightRegular, null), disabled: isBusy, onClick: function () { return setIsReassignDialogOpen(true); }, "aria-label": strings.ReassignButtonLabel })))),
            React.createElement(ReassignDialog, { open: isReassignDialogOpen, onOpenChange: setIsReassignDialogOpen, approvalDisplayName: approval.displayName, strings: strings })));
    }
    var approverNames = (approval.approvers || [])
        .map(getIdentityDisplayName)
        .filter(function (name) { return Boolean(name); });
    var reassignedRequest = approval.currentUserRequests.find(function (request) { return request.isReassigned; });
    var reassignedFromName = getIdentityDisplayName(reassignedRequest === null || reassignedRequest === void 0 ? void 0 : reassignedRequest.reassignedFrom);
    return (React.createElement(Card, { className: mergeClasses(styles.card, isAlternate && styles.alternate) },
        React.createElement("div", { className: styles.detailRow },
            React.createElement("div", { className: styles.detailIdentity },
                requesterName && (React.createElement(Avatar, { name: requesterName, image: ((_f = approval.ownerUser) === null || _f === void 0 ? void 0 : _f.photoDataUrl) ? { src: approval.ownerUser.photoDataUrl } : undefined, size: 40 })),
                React.createElement("div", { className: styles.detailIdentityText },
                    React.createElement(Body1Strong, null, approval.displayName),
                    approval.description && (React.createElement(Body1, null, renderTextWithLinks(approval.description, handleOpenLink))),
                    requesterName && (React.createElement("div", { className: styles.requesterInfo },
                        React.createElement(Caption1, { className: styles.requesterCaption },
                            strings.RequestedByLabel,
                            " ",
                            requesterName),
                        requesterMail && (React.createElement(Button, { appearance: "transparent", size: "small", icon: React.createElement(MailRegular, null), onClick: function () { return setIsContactDialogOpen(true); } }, strings.ContactRequesterButtonLabel)))))),
            React.createElement("div", { className: styles.detailHeaderActions },
                React.createElement("div", { className: styles.detailBadges },
                    React.createElement(Badge, { appearance: "filled", color: statusBadgeColor(approval.state) }, statusLabel(approval.state, strings)),
                    approval.approvalType && (React.createElement(Badge, { appearance: "outline" },
                        strings.ApprovalTypeLabel,
                        " ",
                        approval.approvalType)),
                    createdDateTime && (React.createElement(Badge, { appearance: "outline", icon: React.createElement(CalendarRegular, null) },
                        strings.CreatedLabel,
                        " ",
                        createdDateTime)),
                    approverNames.length > 0 && (React.createElement(Badge, { appearance: "outline", icon: React.createElement(PeopleRegular, null) }, approverNames.join(', '))),
                    reassignedFromName && (React.createElement(Badge, { appearance: "outline", color: "informative", icon: React.createElement(PersonArrowRightRegular, null) }, reassignedFromName))),
                isPending && (React.createElement("div", { className: styles.detailActions },
                    React.createElement(Button, { appearance: "primary", icon: approveIcon, disabled: isBusy, onClick: handleApprove }, strings.ApproveButtonLabel),
                    React.createElement(Button, { appearance: "secondary", icon: rejectIcon, disabled: isBusy, onClick: handleReject }, strings.RejectButtonLabel),
                    React.createElement(Button, { appearance: "secondary", icon: React.createElement(PersonArrowRightRegular, null), disabled: isBusy, onClick: function () { return setIsReassignDialogOpen(true); } }, strings.ReassignButtonLabel))))),
        errorMessage && (React.createElement("div", { className: styles.cardBody },
            React.createElement(Body1, { className: styles.errorText }, errorMessage))),
        React.createElement(ReassignDialog, { open: isReassignDialogOpen, onOpenChange: setIsReassignDialogOpen, approvalDisplayName: approval.displayName, strings: strings }),
        React.createElement(ContactRequesterDialog, { open: isContactDialogOpen, onOpenChange: setIsContactDialogOpen, approvalDisplayName: approval.displayName, requesterName: requesterName !== null && requesterName !== void 0 ? requesterName : '', onSend: function (subject, body) { return onContactRequester(approval, subject, body); }, strings: strings })));
}
//# sourceMappingURL=ApprovalListItem.js.map