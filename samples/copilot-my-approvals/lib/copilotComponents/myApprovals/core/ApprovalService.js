import { __awaiter, __generator } from "tslib";
/**
 * Reads a small profile photo from Graph as a self-contained data URL.
 * Resolves to undefined (never throws) if the user has no photo, the app
 * lacks permission to read it, or any other Graph error occurs.
 *
 * @param photoPath e.g. "/me/photos/64x64/$value" or "/users/{id}/photos/64x64/$value"
 */
export function getPhotoDataUrl(graphClient, photoPath) {
    return __awaiter(this, void 0, void 0, function () {
        var photoBlob, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, graphClient
                            .api(photoPath)
                            .version("v1.0")
                            .get()];
                case 1:
                    photoBlob = _a.sent();
                    return [4 /*yield*/, blobToDataUrl(photoBlob)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_1 = _a.sent();
                    return [2 /*return*/, undefined];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onloadend = function () { return resolve(reader.result); };
        reader.onerror = function () { return reject(reader.error); };
        reader.readAsDataURL(blob);
    });
}
/**
 * Service for reading Microsoft 365 approval items from an SPFx solution.
 */
var ApprovalService = /** @class */ (function () {
    function ApprovalService(graphClientFactory) {
        this.graphClientFactory = graphClientFactory;
    }
    /**
     * Gets every pending approval currently assigned to the signed-in user.
     *
     * @param includeGroupAssignments
     * When true, approvals assigned to a group containing the current user
     * are also returned. This can require an additional Graph permission.
     */
    ApprovalService.prototype.getMyApprovalsByStatus = function (status_1) {
        return __awaiter(this, arguments, void 0, function (status, includeGroupAssignments) {
            var graphClient, currentUser, groupIds, _a, approvalItems, result, concurrency, offset, batch, evaluated, _i, evaluated_1, approval;
            var _this = this;
            if (includeGroupAssignments === void 0) { includeGroupAssignments = false; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.graphClientFactory.getClient("3")];
                    case 1:
                        graphClient = _b.sent();
                        return [4 /*yield*/, this.getCurrentUser(graphClient)];
                    case 2:
                        currentUser = _b.sent();
                        if (!includeGroupAssignments) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.getCurrentUserGroupIds(graphClient)];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        _a = new Set();
                        _b.label = 5;
                    case 5:
                        groupIds = _a;
                        return [4 /*yield*/, this.getAllPages(graphClient, "/solutions/approval/approvalItems" +
                                /*"?$filter=state%20eq%20'pending'" + NOT supported */
                                "?$select=id,displayName,description,state,approvalType," +
                                "createdDateTime,completedDateTime,owner,approvers,responsePrompts")];
                    case 6:
                        approvalItems = _b.sent();
                        if (status.length > 0)
                            approvalItems = approvalItems.filter(function (approval) { var _a; return ((_a = approval.state) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === status; });
                        result = [];
                        concurrency = 5;
                        offset = 0;
                        _b.label = 7;
                    case 7:
                        if (!(offset < approvalItems.length)) return [3 /*break*/, 10];
                        batch = approvalItems.slice(offset, offset + concurrency);
                        return [4 /*yield*/, Promise.all(batch.map(function (approval) { return __awaiter(_this, void 0, void 0, function () {
                                var requests, currentUserRequests, ownerUser;
                                var _this = this;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.getApprovalRequests(graphClient, approval.id)];
                                        case 1:
                                            requests = _a.sent();
                                            currentUserRequests = requests.filter(function (request) {
                                                return _this.isAssignedToCurrentUser(request.approver, currentUser.id, groupIds);
                                            });
                                            return [4 /*yield*/, this.resolveApprovalRequester(graphClient, approval)];
                                        case 2:
                                            ownerUser = _a.sent();
                                            if (currentUserRequests.length === 0) {
                                                return [2 /*return*/, undefined];
                                            }
                                            return [2 /*return*/, {
                                                    id: approval.id,
                                                    displayName: approval.displayName,
                                                    description: approval.description,
                                                    state: approval.state,
                                                    approvalType: approval.approvalType,
                                                    createdDateTime: approval.createdDateTime,
                                                    completedDateTime: approval.completedDateTime,
                                                    owner: approval.owner,
                                                    approvers: approval.approvers,
                                                    responsePrompts: approval.responsePrompts,
                                                    ownerUser: ownerUser,
                                                    currentUserRequests: currentUserRequests
                                                }];
                                    }
                                });
                            }); }))];
                    case 8:
                        evaluated = _b.sent();
                        for (_i = 0, evaluated_1 = evaluated; _i < evaluated_1.length; _i++) {
                            approval = evaluated_1[_i];
                            if (approval) {
                                result.push(approval);
                            }
                        }
                        _b.label = 9;
                    case 9:
                        offset += concurrency;
                        return [3 /*break*/, 7];
                    case 10:
                        console.log(result);
                        return [2 /*return*/, result.sort(function (left, right) {
                                var leftDate = left.createdDateTime
                                    ? Date.parse(left.createdDateTime)
                                    : 0;
                                var rightDate = right.createdDateTime
                                    ? Date.parse(right.createdDateTime)
                                    : 0;
                                return rightDate - leftDate;
                            })];
                }
            });
        });
    };
    /**
     * Submits the signed-in user's response to a pending approval item.
     *
     * There is no documented Graph endpoint to trigger a reassignment —
     * `approvalItemRequest.isReassigned`/`reassignedFrom` are read-only status
     * fields, not an action — so this only covers Approve/Reject.
     */
    ApprovalService.prototype.respondToApproval = function (approvalItemId, response, comments) {
        return __awaiter(this, void 0, void 0, function () {
            var graphClient;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.graphClientFactory.getClient("3")];
                    case 1:
                        graphClient = _a.sent();
                        return [4 /*yield*/, graphClient
                                .api("/solutions/approval/approvalItems/".concat(encodeURIComponent(approvalItemId), "/responses"))
                                .version("beta")
                                .post({ response: response, comments: comments })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Sends an email from the signed-in user's own mailbox (via `/me/sendMail`)
     * to the given address — used to let an approver contact an approval's
     * requester.
     */
    ApprovalService.prototype.sendMailToRequester = function (toAddress, subject, body) {
        return __awaiter(this, void 0, void 0, function () {
            var graphClient;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.graphClientFactory.getClient("3")];
                    case 1:
                        graphClient = _a.sent();
                        return [4 /*yield*/, graphClient
                                .api("/me/sendMail")
                                .version("v1.0")
                                .post({
                                message: {
                                    subject: subject,
                                    body: { contentType: "Text", content: body },
                                    toRecipients: [{ emailAddress: { address: toAddress } }]
                                },
                                saveToSentItems: true
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ApprovalService.prototype.getCurrentUser = function (graphClient) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, graphClient
                        .api("/me")
                        .version("v1.0")
                        .select("id,displayName,userPrincipalName")
                        .get()];
            });
        });
    };
    ApprovalService.prototype.getApprovalRequests = function (graphClient, approvalItemId) {
        return __awaiter(this, void 0, void 0, function () {
            var encodedId;
            return __generator(this, function (_a) {
                encodedId = encodeURIComponent(approvalItemId);
                return [2 /*return*/, this.getAllPages(graphClient, "/solutions/approval/approvalItems/".concat(encodedId, "/requests") +
                        "?$select=id,createdDateTime,approver,isReassigned,reassignedFrom")];
            });
        });
    };
    ApprovalService.prototype.resolveApprovalRequester = function (graphClient, approval) {
        return __awaiter(this, void 0, void 0, function () {
            var ownerUser, photoPromise, user, error_2;
            var _a, _b;
            var _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        ownerUser = (_c = approval.owner) === null || _c === void 0 ? void 0 : _c.user;
                        if (!(ownerUser === null || ownerUser === void 0 ? void 0 : ownerUser.id)) {
                            return [2 /*return*/, undefined];
                        }
                        photoPromise = this.getUserPhotoDataUrl(graphClient, ownerUser.id);
                        _h.label = 1;
                    case 1:
                        _h.trys.push([1, 4, , 6]);
                        return [4 /*yield*/, graphClient
                                .api("/users/".concat(encodeURIComponent(ownerUser.id)))
                                .version("v1.0")
                                .select("id,displayName,userPrincipalName,mail")
                                .get()];
                    case 2:
                        user = _h.sent();
                        _a = {
                            id: user.id,
                            displayName: (_f = (_e = (_d = user.displayName) !== null && _d !== void 0 ? _d : ownerUser.displayName) !== null && _e !== void 0 ? _e : user.userPrincipalName) !== null && _f !== void 0 ? _f : user.id,
                            userPrincipalName: user.userPrincipalName,
                            mail: user.mail
                        };
                        return [4 /*yield*/, photoPromise];
                    case 3: return [2 /*return*/, (_a.photoDataUrl = _h.sent(),
                            _a)];
                    case 4:
                        error_2 = _h.sent();
                        _b = {
                            id: ownerUser.id,
                            displayName: (_g = ownerUser.displayName) !== null && _g !== void 0 ? _g : ownerUser.id
                        };
                        return [4 /*yield*/, photoPromise];
                    case 5: 
                    /*
                     * The owner might have been deleted, might be external, or the
                     * application might not have permission to read the user profile.
                     * Fall back to the identity included in the approval item.
                     */
                    return [2 /*return*/, (_b.photoDataUrl = _h.sent(),
                            _b)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ApprovalService.prototype.getUserPhotoDataUrl = function (graphClient, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, getPhotoDataUrl(graphClient, "/users/".concat(encodeURIComponent(userId), "/photos/64x64/$value"))];
            });
        });
    };
    /**
     * Returns the IDs of groups to which the signed-in user belongs,
     * including nested memberships.
     */
    ApprovalService.prototype.getCurrentUserGroupIds = function (graphClient) {
        return __awaiter(this, void 0, void 0, function () {
            var objects;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getAllPages(graphClient, "/me/transitiveMemberOf/microsoft.graph.group?$select=id")];
                    case 1:
                        objects = _a.sent();
                        return [2 /*return*/, new Set(objects
                                .map(function (item) { var _a; return (_a = item.id) === null || _a === void 0 ? void 0 : _a.toLowerCase(); })
                                .filter(function (id) { return Boolean(id); }))];
                }
            });
        });
    };
    ApprovalService.prototype.isAssignedToCurrentUser = function (approver, currentUserId, currentUserGroupIds) {
        var _a, _b, _c, _d;
        var normalizedUserId = currentUserId.toLowerCase();
        var assignedUserId = (_b = (_a = approver === null || approver === void 0 ? void 0 : approver.user) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toLowerCase();
        if (assignedUserId === normalizedUserId) {
            return true;
        }
        var assignedGroupId = (_d = (_c = approver === null || approver === void 0 ? void 0 : approver.group) === null || _c === void 0 ? void 0 : _c.id) === null || _d === void 0 ? void 0 : _d.toLowerCase();
        return Boolean(assignedGroupId && currentUserGroupIds.has(assignedGroupId));
    };
    /**
     * Reads all Graph pages by following @odata.nextLink.
     */
    ApprovalService.prototype.getAllPages = function (graphClient, initialUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var values, nextUrl, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        values = [];
                        nextUrl = initialUrl;
                        _a.label = 1;
                    case 1:
                        if (!nextUrl) return [3 /*break*/, 3];
                        return [4 /*yield*/, graphClient
                                .api(this.normalizeGraphUrl(nextUrl))
                                .version("beta")
                                .get()];
                    case 2:
                        response = _a.sent();
                        if (Array.isArray(response.value)) {
                            values.push.apply(values, response.value);
                        }
                        nextUrl = response["@odata.nextLink"];
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, values];
                }
            });
        });
    };
    /**
     * Graph SDK accepts a relative Graph path. nextLink is usually absolute.
     */
    ApprovalService.prototype.normalizeGraphUrl = function (url) {
        var graphHost = "https://graph.microsoft.com";
        return url.startsWith(graphHost)
            ? url.substring(graphHost.length)
            : url;
    };
    return ApprovalService;
}());
export { ApprovalService };
//# sourceMappingURL=ApprovalService.js.map