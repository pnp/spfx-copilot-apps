"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MyApprovals;
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var react_components_1 = require("@fluentui/react-components");
var react_icons_1 = require("@fluentui/react-icons");
var sp_copilot_component_1 = require("@microsoft/sp-copilot-component");
var ApprovalListItem_1 = tslib_1.__importDefault(require("./ApprovalListItem"));
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
var useStyles = (0, react_components_1.makeStyles)({
    root: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalM,
        padding: react_components_1.tokens.spacingHorizontalM
    },
    header: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalXS
    },
    headerCard: {
        boxShadow: react_components_1.tokens.shadow4,
        borderRadius: react_components_1.tokens.borderRadiusXLarge
    },
    headerMessage: {
        color: react_components_1.tokens.colorNeutralForeground3
    },
    badges: {
        display: 'flex',
        gap: react_components_1.tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    actions: {
        display: 'flex',
        gap: react_components_1.tokens.spacingHorizontalS,
        flexWrap: 'wrap'
    },
    approvalsSection: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalS
    },
    filterRow: {
        display: 'flex',
        alignItems: 'center',
        gap: react_components_1.tokens.spacingHorizontalS
    },
    approvalsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalS
    },
    skeletonRow: {
        display: 'flex',
        alignItems: 'center',
        gap: react_components_1.tokens.spacingHorizontalM,
        padding: react_components_1.tokens.spacingVerticalS
    },
    skeletonText: {
        display: 'flex',
        flexDirection: 'column',
        gap: react_components_1.tokens.spacingVerticalXS,
        flexGrow: 1
    },
    emptyState: {
        color: react_components_1.tokens.colorNeutralForeground3,
        padding: react_components_1.tokens.spacingVerticalM
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
function MyApprovals(props) {
    var _this = this;
    var message = props.message, userDisplayName = props.userDisplayName, userPhotoDataUrl = props.userPhotoDataUrl, siteTitle = props.siteTitle, siteUrl = props.siteUrl, hostContext = props.hostContext, bridge = props.bridge, onRequestDisplayMode = props.onRequestDisplayMode, onRequestSizeChange = props.onRequestSizeChange, strings = props.strings, pendingApprovals = props.pendingApprovals, onApprove = props.onApprove, onReject = props.onReject, onContactRequester = props.onContactRequester, statusFilter = props.statusFilter, isLoadingApprovals = props.isLoadingApprovals, onStatusFilterChange = props.onStatusFilterChange;
    var styles = useStyles();
    var _a = React.useState(false), isExpanded = _a[0], setIsExpanded = _a[1];
    var theme = hostContext.theme === 'dark' ? react_components_1.webDarkTheme : react_components_1.webLightTheme;
    // Request the Copilot host to switch this component to fullscreen mode.
    var handleExpand = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onRequestDisplayMode('fullscreen')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [onRequestDisplayMode]);
    // Ask the host to return this component to inline mode.
    var handleCollapse = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, onRequestDisplayMode('inline')];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [onRequestDisplayMode]);
    // Ask the host to open the site URL in the user's browser.
    var handleOpenLink = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
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
    var handleFollowUp = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, bridge.sendFollowUpMessageAsync([
                        (0, sp_copilot_component_1.createCopilotTextContent)(strings.FollowUpMessage.replace('{0}', siteTitle))
                    ])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); }, [bridge, siteTitle, strings]);
    // Toggle between compact and expanded sizes by requesting a resize from the host.
    var handleResize = React.useCallback(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
        return tslib_1.__generator(this, function (_a) {
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
    return (React.createElement(react_components_1.IdPrefixProvider, { value: "copilot-component-" },
        React.createElement(react_components_1.FluentProvider, { theme: theme, targetDocument: props.targetDocument, style: { minHeight: '100%' } },
            React.createElement("div", { className: styles.root },
                React.createElement(react_components_1.Card, { className: styles.headerCard, appearance: "filled-alternative", size: "large" },
                    React.createElement(react_components_1.CardHeader, { image: React.createElement(react_components_1.Avatar, { name: userDisplayName, image: userPhotoDataUrl ? { src: userPhotoDataUrl } : undefined, size: 48 }), header: React.createElement(react_components_1.Title1, null,
                            strings.GreetingPrefix,
                            " ",
                            userDisplayName,
                            "!"), description: React.createElement(react_components_1.Body1, { className: styles.headerMessage }, message), action: isFullscreen ? (React.createElement(react_components_1.Button, { appearance: "primary", size: "small", icon: React.createElement(react_icons_1.ArrowMinimize24Regular, null), onClick: handleCollapse }, strings.CollapseButtonLabel)) : (React.createElement(react_components_1.Button, { appearance: "primary", size: "small", icon: React.createElement(react_icons_1.ArrowExpand24Regular, null), onClick: handleExpand }, strings.ExpandButtonLabel)) })),
                React.createElement("div", { className: styles.actions },
                    React.createElement(react_components_1.Button, { appearance: "secondary", icon: React.createElement(react_icons_1.Open24Regular, null), onClick: handleOpenLink }, strings.OpenSiteButtonLabel),
                    React.createElement(react_components_1.Button, { appearance: "secondary", icon: React.createElement(react_icons_1.Chat24Regular, null), onClick: handleFollowUp }, strings.FollowUpButtonLabel),
                    React.createElement(react_components_1.Button, { appearance: "secondary", icon: React.createElement(react_icons_1.ResizeLarge24Regular, null), onClick: handleResize }, isExpanded ? strings.CompactButtonLabel : strings.ResizeButtonLabel)),
                React.createElement("div", { className: styles.approvalsSection },
                    React.createElement(react_components_1.Title2, null, isFullscreen ? strings.ApprovalsSectionTitle : strings.PendingApprovalsSectionTitle),
                    isFullscreen && (React.createElement("div", { className: styles.filterRow },
                        React.createElement(react_components_1.Dropdown, { "aria-label": strings.StatusFilterLabel, value: statusFilterLabel(statusFilter, strings), selectedOptions: [statusFilter], disabled: isLoadingApprovals, onOptionSelect: function (_event, data) {
                                var _a;
                                onStatusFilterChange(((_a = data.optionValue) !== null && _a !== void 0 ? _a : ''));
                            } },
                            React.createElement(react_components_1.Option, { value: "" }, strings.StatusFilterAllOption),
                            React.createElement(react_components_1.Option, { value: "pending" }, strings.StatusFilterPendingOption),
                            React.createElement(react_components_1.Option, { value: "completed" }, strings.StatusFilterCompletedOption),
                            React.createElement(react_components_1.Option, { value: "canceled" }, strings.StatusFilterCanceledOption),
                            React.createElement(react_components_1.Option, { value: "created" }, strings.StatusFilterCreatedOption)),
                        isLoadingApprovals && React.createElement(react_components_1.Spinner, { size: "tiny" }))),
                    isLoadingApprovals ? (React.createElement(react_components_1.Skeleton, { className: styles.approvalsList, "aria-label": strings.PendingApprovalsSectionTitle }, [0, 1, 2].map(function (index) { return (React.createElement("div", { key: index, className: styles.skeletonRow },
                        React.createElement(react_components_1.SkeletonItem, { shape: "circle", size: 40 }),
                        React.createElement("div", { className: styles.skeletonText },
                            React.createElement(react_components_1.SkeletonItem, { size: 16 }),
                            React.createElement(react_components_1.SkeletonItem, { size: 12 })))); }))) : itemsToRender.length === 0 ? (React.createElement(react_components_1.Body1, { className: styles.emptyState }, isFullscreen ? strings.NoApprovalsMessage : strings.NoPendingApprovalsMessage)) : (React.createElement(react_components_1.List, { className: styles.approvalsList }, itemsToRender.map(function (approval, index) { return (React.createElement(react_components_1.ListItem, { key: approval.id },
                        React.createElement(ApprovalListItem_1.default, { approval: approval, variant: isFullscreen ? 'detailed' : 'compact', onApprove: onApprove, onReject: onReject, onContactRequester: onContactRequester, onOpenLink: function (url) { void bridge.openLinkAsync(url); }, isAlternate: index % 2 === 1, strings: strings }))); }))))))));
}
//# sourceMappingURL=MyApprovals.js.map