import { __awaiter, __generator } from "tslib";
import * as React from 'react';
import { FluentProvider, IdPrefixProvider, webLightTheme, webDarkTheme, Title1, Title2, Body1, Button, Card, CardHeader, Avatar, Dropdown, Option, List, ListItem, Spinner, Skeleton, SkeletonItem, makeStyles, tokens } from '@fluentui/react-components';
import { ArrowExpand24Regular, ArrowMinimize24Regular, Open24Regular, Chat24Regular, ResizeLarge24Regular } from '@fluentui/react-icons';
import { createCopilotTextContent } from '@microsoft/sp-copilot-component';
import ApprovalListItem from './ApprovalListItem';
function statusFilterLabel(status, strings) {
    switch (status) {
        case 'pending':
            return strings.StatusFilterPendingOption;
        case 'completed':
            return strings.StatusFilterCompletedOption;
        case 'canceled':
            return strings.StatusFilterCanceledOption;
        case 'created':
            return strings.StatusFilterCreatedOption;
        case '':
        default:
            return strings.StatusFilterAllOption;
    }
}
var useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
        padding: tokens.spacingHorizontalM
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS
    },
    headerCard: {
        boxShadow: tokens.shadow4,
        borderRadius: tokens.borderRadiusXLarge
    },
    headerMessage: {
        color: tokens.colorNeutralForeground3
    },
    badges: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    actions: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    approvalsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS
    },
    filterRow: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS
    },
    approvalsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalS
    },
    skeletonRow: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        padding: tokens.spacingVerticalS
    },
    skeletonText: {
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXS,
        flexGrow: 1
    },
    emptyState: {
        color: tokens.colorNeutralForeground3,
        padding: tokens.spacingVerticalM
    }
});
var EXPANDED_WIDTH = 600;
var EXPANDED_HEIGHT = 400;
var COMPACT_WIDTH = 400;
var COMPACT_HEIGHT = 250;
/**
 * Main React UI for the Copilot Component starter template.
 *
 * Demonstrates:
 * - **Theming** — wraps content in `<FluentProvider>` with a theme derived
 *   from the host's `hostContext.theme` (`'light' | 'dark'`).
 * - **Host context** — surfaces the current display mode, theme, and
 *   available display modes as live badges.
 * - **Bridge actions** — four buttons that exercise different bridge methods
 *   to show how a component communicates with the Copilot host.
 */
export default function MyApprovals(props) {
    var _this = this;
    var message = props.message, userDisplayName = props.userDisplayName, userPhotoDataUrl = props.userPhotoDataUrl, siteTitle = props.siteTitle, siteUrl = props.siteUrl, hostContext = props.hostContext, bridge = props.bridge, onRequestDisplayMode = props.onRequestDisplayMode, onRequestSizeChange = props.onRequestSizeChange, strings = props.strings, pendingApprovals = props.pendingApprovals, onApprove = props.onApprove, onReject = props.onReject, onContactRequester = props.onContactRequester, statusFilter = props.statusFilter, isLoadingApprovals = props.isLoadingApprovals, onStatusFilterChange = props.onStatusFilterChange;
    var styles = useStyles();
    var _a = React.useState(false), isExpanded = _a[0], setIsExpanded = _a[1];
    var theme = hostContext.theme === 'dark' ? webDarkTheme : webLightTheme;
    // Request the Copilot host to switch this component to fullscreen mode.
    var handleExpand = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onRequestDisplayMode('fullscreen')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [onRequestDisplayMode]);
    // Ask the host to return this component to inline mode.
    var handleCollapse = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onRequestDisplayMode('inline')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [onRequestDisplayMode]);
    // Ask the host to open the site URL in the user's browser.
    var handleOpenLink = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bridge.openLinkAsync(siteUrl)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [bridge, siteUrl]);
    // Send a follow-up message into the Copilot conversation on behalf of the user.
    // This triggers Copilot to respond, demonstrating how a component can drive the chat.
    var handleFollowUp = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bridge.sendFollowUpMessageAsync([
                        createCopilotTextContent(strings.FollowUpMessage.replace('{0}', siteTitle))
                    ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [bridge, siteTitle, strings]);
    // Toggle between compact and expanded sizes by requesting a resize from the host.
    var handleResize = React.useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isExpanded) return [3 /*break*/, 2];
                    return [4 /*yield*/, onRequestSizeChange(COMPACT_WIDTH, COMPACT_HEIGHT)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, onRequestSizeChange(EXPANDED_WIDTH, EXPANDED_HEIGHT)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    setIsExpanded(!isExpanded);
                    return [2 /*return*/];
            }
        });
    }); }, [onRequestSizeChange, isExpanded]);
    var isFullscreen = hostContext.displayMode === 'fullscreen';
    // Inline must always show pending approvals only, even if `pendingApprovals`
    // still holds a stale non-pending fullscreen result during the brief window
    // before a forced reset-to-pending reload resolves.
    var itemsToRender = isFullscreen
        ? pendingApprovals
        : pendingApprovals.filter(function (approval) { return approval.state === 'pending'; });
    return (React.createElement(IdPrefixProvider, { value: "copilot-component-" },
        React.createElement(FluentProvider, { theme: theme, targetDocument: props.targetDocument, style: { minHeight: '100%' } },
            React.createElement("div", { className: styles.root },
                React.createElement(Card, { className: styles.headerCard, appearance: "filled-alternative", size: "large" },
                    React.createElement(CardHeader, { image: React.createElement(Avatar, { name: userDisplayName, image: userPhotoDataUrl ? { src: userPhotoDataUrl } : undefined, size: 48 }), header: React.createElement(Title1, null,
                            strings.GreetingPrefix,
                            " ",
                            userDisplayName,
                            "!"), description: React.createElement(Body1, { className: styles.headerMessage }, message), action: isFullscreen ? (React.createElement(Button, { appearance: "primary", size: "small", icon: React.createElement(ArrowMinimize24Regular, null), onClick: handleCollapse }, strings.CollapseButtonLabel)) : (React.createElement(Button, { appearance: "primary", size: "small", icon: React.createElement(ArrowExpand24Regular, null), onClick: handleExpand }, strings.ExpandButtonLabel)) })),
                React.createElement("div", { className: styles.actions },
                    React.createElement(Button, { appearance: "secondary", icon: React.createElement(Open24Regular, null), onClick: handleOpenLink }, strings.OpenSiteButtonLabel),
                    React.createElement(Button, { appearance: "secondary", icon: React.createElement(Chat24Regular, null), onClick: handleFollowUp }, strings.FollowUpButtonLabel),
                    React.createElement(Button, { appearance: "secondary", icon: React.createElement(ResizeLarge24Regular, null), onClick: handleResize }, isExpanded ? strings.CompactButtonLabel : strings.ResizeButtonLabel)),
                React.createElement("div", { className: styles.approvalsSection },
                    React.createElement(Title2, null, isFullscreen ? strings.ApprovalsSectionTitle : strings.PendingApprovalsSectionTitle),
                    isFullscreen && (React.createElement("div", { className: styles.filterRow },
                        React.createElement(Dropdown, { "aria-label": strings.StatusFilterLabel, value: statusFilterLabel(statusFilter, strings), selectedOptions: [statusFilter], disabled: isLoadingApprovals, onOptionSelect: function (_event, data) {
                                var _a;
                                onStatusFilterChange(((_a = data.optionValue) !== null && _a !== void 0 ? _a : ''));
                            } },
                            React.createElement(Option, { value: "" }, strings.StatusFilterAllOption),
                            React.createElement(Option, { value: "pending" }, strings.StatusFilterPendingOption),
                            React.createElement(Option, { value: "completed" }, strings.StatusFilterCompletedOption),
                            React.createElement(Option, { value: "canceled" }, strings.StatusFilterCanceledOption),
                            React.createElement(Option, { value: "created" }, strings.StatusFilterCreatedOption)),
                        isLoadingApprovals && React.createElement(Spinner, { size: "tiny" }))),
                    isLoadingApprovals ? (React.createElement(Skeleton, { className: styles.approvalsList, "aria-label": strings.PendingApprovalsSectionTitle }, [0, 1, 2].map(function (index) { return (React.createElement("div", { key: index, className: styles.skeletonRow },
                        React.createElement(SkeletonItem, { shape: "circle", size: 40 }),
                        React.createElement("div", { className: styles.skeletonText },
                            React.createElement(SkeletonItem, { size: 16 }),
                            React.createElement(SkeletonItem, { size: 12 })))); }))) : itemsToRender.length === 0 ? (React.createElement(Body1, { className: styles.emptyState }, isFullscreen ? strings.NoApprovalsMessage : strings.NoPendingApprovalsMessage)) : (React.createElement(List, { className: styles.approvalsList }, itemsToRender.map(function (approval, index) { return (React.createElement(ListItem, { key: approval.id },
                        React.createElement(ApprovalListItem, { approval: approval, variant: isFullscreen ? 'detailed' : 'compact', onApprove: onApprove, onReject: onReject, onContactRequester: onContactRequester, onOpenLink: function (url) { void bridge.openLinkAsync(url); }, isAlternate: index % 2 === 1, strings: strings }))); }))))))));
}
//# sourceMappingURL=MyApprovals.js.map