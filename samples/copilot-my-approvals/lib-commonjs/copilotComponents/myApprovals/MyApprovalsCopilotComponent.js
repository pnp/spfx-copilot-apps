"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var React = tslib_1.__importStar(require("react"));
var ReactDOM = tslib_1.__importStar(require("react-dom"));
var sp_copilot_component_1 = require("@microsoft/sp-copilot-component");
var sp_http_1 = require("@microsoft/sp-http");
var MyApprovals_1 = tslib_1.__importDefault(require("./components/MyApprovals"));
var ApprovalService_1 = require("./core/ApprovalService");
var strings = tslib_1.__importStar(require("MyApprovalsCopilotComponentStrings"));
/**
 * SPFx Copilot Component that renders a React-based UI demonstrating the
 * platform's headline capabilities:
 *
 * - **Brokered SSO data calls** — Microsoft Graph (`/me`) and SharePoint REST
 *   (`/_api/web`) with zero token code. The SPFx runtime's Pairwise Broker
 *   automatically provisions tokens for `SPHttpClient` and `MSGraphClientV3`.
 *
 * - **Host context & theming** — reads `hostContext.theme` and
 *   `hostContext.displayMode` to adapt to the Copilot host environment.
 *
 * - **Bridge actions** — demonstrates `requestDisplayModeAsync`,
 *   `openLinkAsync`, `sendFollowUpMessageAsync`, and `requestSizeChangeAsync`.
 *
 * Lifecycle:
 *  1. `onInit()` — fetches user and site data (runs once before first render).
 *  2. `render()` — mounts the React tree into `this.context.domElement`.
 *     Re-invoked by the framework on host-context changes.
 *  3. `onTeardown()` — unmounts React before the host tears down the iframe.
 */
var MyApprovalsCopilotComponent = /** @class */ (function (_super) {
    tslib_1.__extends(MyApprovalsCopilotComponent, _super);
    function MyApprovalsCopilotComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this._userDisplayName = '';
        _this._siteTitle = '';
        _this._siteUrl = '';
        _this._pendingApprovals = [];
        _this._statusFilter = 'pending';
        _this._isLoadingApprovals = false;
        _this._loadRequestId = 0;
        return _this;
    }
    MyApprovalsCopilotComponent.prototype.onInit = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var graphClient, me, _a, _b, response, webInfo, _c;
            var _d;
            return tslib_1.__generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        this._siteUrl = this.context.pageContext.web.absoluteUrl;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.context.msGraphClientFactory.getClient('3')];
                    case 2:
                        graphClient = _e.sent();
                        return [4 /*yield*/, graphClient.api('/me').select('displayName').get()];
                    case 3:
                        me = _e.sent();
                        this._userDisplayName = me.displayName || 'User';
                        _a = this;
                        return [4 /*yield*/, (0, ApprovalService_1.getPhotoDataUrl)(graphClient, '/me/photos/64x64/$value')];
                    case 4:
                        _a._userPhotoDataUrl = _e.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        _b = _e.sent();
                        this._userDisplayName = ((_d = this.context.pageContext.user) === null || _d === void 0 ? void 0 : _d.displayName) || 'User';
                        return [3 /*break*/, 6];
                    case 6:
                        _e.trys.push([6, 9, , 10]);
                        return [4 /*yield*/, this.context.spHttpClient.get("".concat(this._siteUrl, "/_api/web?$select=Title"), sp_http_1.SPHttpClient.configurations.v1)];
                    case 7:
                        response = _e.sent();
                        return [4 /*yield*/, response.json()];
                    case 8:
                        webInfo = _e.sent();
                        this._siteTitle = webInfo.Title || 'SharePoint Site';
                        return [3 /*break*/, 10];
                    case 9:
                        _c = _e.sent();
                        this._siteTitle = 'SharePoint Site';
                        return [3 /*break*/, 10];
                    case 10: return [4 /*yield*/, this._loadApprovals('pending')];
                    case 11:
                        _e.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Loads the current user's approvals (including group-assigned ones) for
    // the given status from Microsoft Graph via the brokered SSO client.
    // Renders immediately to show a loading state, then again once the fetch
    // settles. `_loadRequestId` discards the result of a superseded call if a
    // newer status/reload was requested before this one finished.
    MyApprovalsCopilotComponent.prototype._loadApprovals = function (status) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var requestId, approvals, approvalService, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        requestId = ++this._loadRequestId;
                        this._statusFilter = status;
                        this._isLoadingApprovals = true;
                        this.render();
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        approvalService = new ApprovalService_1.ApprovalService(this.context.msGraphClientFactory);
                        return [4 /*yield*/, approvalService.getMyApprovalsByStatus(status, true)];
                    case 2:
                        approvals = _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        approvals = [];
                        return [3 /*break*/, 4];
                    case 4:
                        if (requestId !== this._loadRequestId) {
                            return [2 /*return*/];
                        }
                        this._pendingApprovals = approvals;
                        this._isLoadingApprovals = false;
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    // The Copilot host resets the component back to inline after a fullscreen
    // session; inline must always show pending approvals regardless of
    // whatever status filter was last selected in fullscreen.
    MyApprovalsCopilotComponent.prototype.onHostContextChanged = function (diff) {
        if (diff.displayMode === 'inline' && this._statusFilter !== 'pending') {
            void this._loadApprovals('pending');
        }
    };
    // Submits an Approve/Reject response for an approval item, then removes it
    // from the local list optimistically — the Graph endpoint returns 202
    // Accepted, so re-fetching immediately could still show it as pending.
    MyApprovalsCopilotComponent.prototype._respondToApproval = function (approval, response) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var approvalService;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        approvalService = new ApprovalService_1.ApprovalService(this.context.msGraphClientFactory);
                        return [4 /*yield*/, approvalService.respondToApproval(approval.id, response)];
                    case 1:
                        _a.sent();
                        this._pendingApprovals = this._pendingApprovals.filter(function (item) { return item.id !== approval.id; });
                        this.render();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Sends an email to an approval's requester from the signed-in user's own
    // mailbox via Microsoft Graph. Does not mutate `_pendingApprovals` or
    // re-render — the dialog that triggered this owns its own busy/error/close
    // state via the resolved/rejected promise.
    MyApprovalsCopilotComponent.prototype._contactRequester = function (approval, subject, body) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var mail, approvalService;
            var _a, _b, _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        mail = (_b = (_a = approval.ownerUser) === null || _a === void 0 ? void 0 : _a.mail) !== null && _b !== void 0 ? _b : (_c = approval.ownerUser) === null || _c === void 0 ? void 0 : _c.userPrincipalName;
                        if (!mail) {
                            throw new Error('No email address available for this requester.');
                        }
                        approvalService = new ApprovalService_1.ApprovalService(this.context.msGraphClientFactory);
                        return [4 /*yield*/, approvalService.sendMailToRequester(mail, subject, body)];
                    case 1:
                        _d.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    MyApprovalsCopilotComponent.prototype.render = function () {
        var _this = this;
        var props = {
            message: this.properties.message,
            userDisplayName: this._userDisplayName,
            userPhotoDataUrl: this._userPhotoDataUrl,
            siteTitle: this._siteTitle,
            siteUrl: this._siteUrl,
            pendingApprovals: this._pendingApprovals,
            onApprove: function (approval) { return _this._respondToApproval(approval, 'Approve'); },
            onReject: function (approval) { return _this._respondToApproval(approval, 'Reject'); },
            onContactRequester: function (approval, subject, body) {
                return _this._contactRequester(approval, subject, body);
            },
            statusFilter: this._statusFilter,
            isLoadingApprovals: this._isLoadingApprovals,
            onStatusFilterChange: function (status) { void _this._loadApprovals(status); },
            hostContext: this.hostContext,
            bridge: this.context.copilotBridge,
            onRequestDisplayMode: function (mode) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.requestDisplayModeAsync(mode)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            onRequestSizeChange: function (width, height) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                return tslib_1.__generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.requestSizeChangeAsync(width, height)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); },
            targetDocument: this.context.domElement.ownerDocument,
            strings: strings
        };
        ReactDOM.render(React.createElement(MyApprovals_1.default, props), this.context.domElement);
    };
    MyApprovalsCopilotComponent.prototype.onTeardown = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                ReactDOM.unmountComponentAtNode(this.context.domElement);
                return [2 /*return*/];
            });
        });
    };
    return MyApprovalsCopilotComponent;
}(sp_copilot_component_1.BaseCopilotComponent));
exports.default = MyApprovalsCopilotComponent;
//# sourceMappingURL=MyApprovalsCopilotComponent.js.map