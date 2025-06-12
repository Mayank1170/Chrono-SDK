"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayPerSecondStream = exports.StreamState = void 0;
var bn_js_1 = require("bn.js");
var stream_1 = require("@streamflow/stream");
var web3_js_1 = require("@solana/web3.js");
var StreamState = /** @class */ (function () {
    function StreamState() {
        this.startTime = null;
        this.totalActiveTime = 0;
    }
    StreamState.prototype.start = function () {
        if (this.startTime === null) {
            this.startTime = Date.now();
        }
    };
    StreamState.prototype.pause = function () {
        if (this.startTime !== null) {
            this.totalActiveTime += Date.now() - this.startTime;
            this.startTime = null;
        }
    };
    StreamState.prototype.resume = function () {
        if (this.startTime === null) {
            this.startTime = Date.now();
        }
    };
    StreamState.prototype.getTotalActiveTime = function () {
        if (this.startTime !== null) {
            return Math.floor((this.totalActiveTime + (Date.now() - this.startTime)) / 1000);
        }
        return Math.floor(this.totalActiveTime / 1000);
    };
    StreamState.prototype.reset = function () {
        this.startTime = null;
        this.totalActiveTime = 0;
    };
    return StreamState;
}());
exports.StreamState = StreamState;
var PayPerSecondStream = /** @class */ (function () {
    function PayPerSecondStream(rpcUrl, options) {
        var _this = this;
        this.currentStreamId = null;
        this.activityDetectionInterval = null;
        this.inactivityTimeout = 60000;
        this.lastActivityTime = Date.now();
        this.isStreamRunning = false;
        this.handleInactivity = function () { return __awaiter(_this, void 0, void 0, function () {
            var currentTime;
            return __generator(this, function (_a) {
                if (this.disableInactivityTimeout)
                    return [2 /*return*/]; // Skip inactivity check if disabled
                currentTime = Date.now();
                if (currentTime - this.lastActivityTime > this.inactivityTimeout && this.isStreamRunning) {
                    this.pause();
                }
                return [2 /*return*/];
            });
        }); };
        this.updateActivity = function () {
            _this.lastActivityTime = Date.now();
            if (!_this.isStreamRunning && _this.currentStreamId) {
                _this.streamState.resume();
                _this.isStreamRunning = true;
            }
        };
        this.connection = new web3_js_1.Connection(rpcUrl, {
            commitment: "confirmed",
            disableRetryOnRateLimit: false,
        });
        this.client = new stream_1.StreamflowSolana.SolanaStreamClient(rpcUrl, undefined, {
            commitment: "confirmed",
            confirmTransactionInitialTimeout: 60000,
        });
        this.streamState = new StreamState();
        this.inactivityTimeout = options.inactivityTimeoutMs || 60000;
        this.ratePerSecond = (0, stream_1.getBN)(options.ratePerSecond, options.tokenDecimals);
        this.tokenDecimals = options.tokenDecimals;
        this.tokenId = options.tokenId;
        this.recipient = options.recipient;
        this.disableInactivityTimeout = options.disableInactivityTimeout || false; // Default to false
    }
    PayPerSecondStream.prototype.executeWithRetry = function (operation_1) {
        return __awaiter(this, arguments, void 0, function (operation, maxRetries, rateLimitRetryMs) {
            var lastError, _loop_1, attempt, state_1;
            if (maxRetries === void 0) { maxRetries = 5; }
            if (rateLimitRetryMs === void 0) { rateLimitRetryMs = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var _b, error_1, backoffTime_1;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 7]);
                                        _b = {};
                                        return [4 /*yield*/, operation()];
                                    case 1: return [2 /*return*/, (_b.value = _c.sent(), _b)];
                                    case 2:
                                        error_1 = _c.sent();
                                        lastError = error_1;
                                        if (!(error_1 instanceof Error)) return [3 /*break*/, 6];
                                        if (!error_1.message.includes("expired")) return [3 /*break*/, 4];
                                        backoffTime_1 = 250 * Math.pow(2, attempt);
                                        console.log("Transaction expired. Retrying in ".concat(backoffTime_1 / 1000, "s... (").concat(maxRetries - attempt - 1, " attempts left)"));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, backoffTime_1); })];
                                    case 3:
                                        _c.sent();
                                        return [2 /*return*/, "continue"];
                                    case 4:
                                        if (!error_1.message.includes("429")) return [3 /*break*/, 6];
                                        console.log("Rate limited (429). Retrying in ".concat(rateLimitRetryMs / 1000, "s..."));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, rateLimitRetryMs); })];
                                    case 5:
                                        _c.sent();
                                        return [2 /*return*/, "continue"];
                                    case 6: throw error_1;
                                    case 7: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt < maxRetries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError;
                }
            });
        });
    };
    PayPerSecondStream.prototype.start = function (wallet_1) {
        return __awaiter(this, arguments, void 0, function (wallet, initialDurationSeconds) {
            var initialAmount_1, result, error_2;
            var _this = this;
            if (initialDurationSeconds === void 0) { initialDurationSeconds = 300; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        this.streamState.start();
                        this.startActivityDetection();
                        initialAmount_1 = this.ratePerSecond.mul(new bn_js_1.default(initialDurationSeconds));
                        return [4 /*yield*/, this.executeWithRetry(function () {
                                return _this.createStream(wallet, initialAmount_1, initialDurationSeconds);
                            })];
                    case 1:
                        result = _a.sent();
                        if (result.success && result.streamId) {
                            this.currentStreamId = result.streamId;
                            this.isStreamRunning = true;
                            return [2 /*return*/, { success: true, streamId: result.streamId }];
                        }
                        this.streamState.pause();
                        return [2 /*return*/, { success: false, error: result.error }];
                    case 2:
                        error_2 = _a.sent();
                        this.streamState.pause();
                        return [2 /*return*/, { success: false, error: error_2 }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PayPerSecondStream.prototype.pause = function () {
        this.streamState.pause();
        this.isStreamRunning = false;
    };
    PayPerSecondStream.prototype.resume = function (wallet_1) {
        return __awaiter(this, arguments, void 0, function (wallet, additionalDurationSeconds) {
            var amount, topupResult, error_3;
            if (additionalDurationSeconds === void 0) { additionalDurationSeconds = 60; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.currentStreamId) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        amount = this.ratePerSecond.mul(new bn_js_1.default(additionalDurationSeconds));
                        return [4 /*yield*/, this.topupStream(this.currentStreamId, wallet, amount)];
                    case 2:
                        topupResult = _a.sent();
                        if (topupResult.success) {
                            this.streamState.resume();
                            this.isStreamRunning = true;
                            return [2 /*return*/, { success: true, streamId: this.currentStreamId }];
                        }
                        return [2 /*return*/, this.start(wallet, additionalDurationSeconds)];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, { success: false, error: error_3 }];
                    case 4: return [2 /*return*/, this.start(wallet, additionalDurationSeconds)];
                }
            });
        });
    };
    PayPerSecondStream.prototype.stop = function (wallet) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        this.stopActivityDetection();
                        this.pause();
                        if (!this.currentStreamId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.client.cancel({ id: this.currentStreamId }, { invoker: wallet })];
                    case 1:
                        result = _a.sent();
                        this.currentStreamId = null;
                        return [2 /*return*/, { success: true }];
                    case 2: return [2 /*return*/, { success: true }];
                    case 3:
                        error_4 = _a.sent();
                        console.error("Error canceling stream:", error_4);
                        return [2 /*return*/, { success: false, error: error_4 }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    PayPerSecondStream.prototype.getStreamStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeTimeSeconds, stream, withdrawnAmount, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        activeTimeSeconds = this.streamState.getTotalActiveTime();
                        if (!this.currentStreamId) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.getOne({ id: this.currentStreamId })];
                    case 2:
                        stream = _a.sent();
                        withdrawnAmount = (0, stream_1.getNumberFromBN)(stream.withdrawnAmount, this.tokenDecimals);
                        return [2 /*return*/, {
                                isRunning: this.isStreamRunning,
                                activeTimeSeconds: activeTimeSeconds,
                                streamInfo: stream,
                                totalCost: withdrawnAmount,
                            }];
                    case 3:
                        error_5 = _a.sent();
                        return [2 /*return*/, { isRunning: this.isStreamRunning, activeTimeSeconds: activeTimeSeconds }];
                    case 4: return [2 /*return*/, { isRunning: this.isStreamRunning, activeTimeSeconds: activeTimeSeconds }];
                }
            });
        });
    };
    PayPerSecondStream.prototype.startActivityDetection = function () {
        if (this.activityDetectionInterval)
            clearInterval(this.activityDetectionInterval);
        this.activityDetectionInterval = setInterval(this.handleInactivity, 10000);
        if (typeof window !== "undefined") {
            window.addEventListener("mousemove", this.updateActivity);
            window.addEventListener("keypress", this.updateActivity);
            window.addEventListener("scroll", this.updateActivity);
            window.addEventListener("click", this.updateActivity);
        }
    };
    PayPerSecondStream.prototype.stopActivityDetection = function () {
        if (this.activityDetectionInterval) {
            clearInterval(this.activityDetectionInterval);
            this.activityDetectionInterval = null;
        }
        if (typeof window !== "undefined") {
            window.removeEventListener("mousemove", this.updateActivity);
            window.removeEventListener("keypress", this.updateActivity);
            window.removeEventListener("scroll", this.updateActivity);
            window.removeEventListener("click", this.updateActivity);
        }
    };
    PayPerSecondStream.prototype.createStream = function (wallet_1, amount_1, durationSeconds_1) {
        return __awaiter(this, arguments, void 0, function (wallet, amount, durationSeconds, retryCount) {
            var now, start, cliff, _a, blockhash, lastValidBlockHeight, createStreamParams, result, txId, metadataId, confirmed, error_6, backoffTime_2;
            if (retryCount === void 0) { retryCount = 5; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 7]);
                        now = Math.floor(Date.now() / 1000);
                        start = now + 5;
                        cliff = start + 5;
                        return [4 /*yield*/, this.connection.getLatestBlockhashAndContext("confirmed")];
                    case 1:
                        _a = (_b.sent()).value, blockhash = _a.blockhash, lastValidBlockHeight = _a.lastValidBlockHeight;
                        createStreamParams = {
                            recipient: this.recipient,
                            tokenId: this.tokenId,
                            start: start,
                            amount: this.ratePerSecond.mul(new bn_js_1.default(durationSeconds)),
                            period: 1,
                            cliff: cliff,
                            cliffAmount: new bn_js_1.default(0),
                            amountPerPeriod: this.ratePerSecond,
                            name: "Pay-per-second stream",
                            canTopup: true,
                            cancelableBySender: true,
                            cancelableByRecipient: false,
                            transferableBySender: false,
                            transferableByRecipient: false,
                            automaticWithdrawal: true,
                            withdrawalFrequency: 10,
                        };
                        return [4 /*yield*/, this.client.create(createStreamParams, { sender: wallet, isNative: false })];
                    case 2:
                        result = _b.sent();
                        txId = result.txId, metadataId = result.metadataId;
                        return [4 /*yield*/, this.monitorTransaction(txId, lastValidBlockHeight)];
                    case 3:
                        confirmed = _b.sent();
                        if (!confirmed) {
                            throw new Error("Transaction ".concat(txId, " failed to confirm within retry window"));
                        }
                        console.log("Stream transaction confirmed: ".concat(txId));
                        return [2 /*return*/, { success: true, streamId: metadataId }];
                    case 4:
                        error_6 = _b.sent();
                        console.error("Error creating stream:", error_6);
                        if (!(error_6 instanceof Error && (error_6.message.includes("expired") || error_6.message.includes("429")) && retryCount > 0)) return [3 /*break*/, 6];
                        backoffTime_2 = 250 * Math.pow(2, 5 - retryCount);
                        console.log("Transaction issue. Retrying in ".concat(backoffTime_2 / 1000, "s... (").concat(retryCount, " attempts left)"));
                        return [4 /*yield*/, new Promise(function (res) { return setTimeout(res, backoffTime_2); })];
                    case 5:
                        _b.sent();
                        return [2 /*return*/, this.createStream(wallet, amount, durationSeconds, retryCount - 1)];
                    case 6: return [2 /*return*/, { success: false, error: error_6 }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    PayPerSecondStream.prototype.monitorTransaction = function (txId_1, lastValidBlockHeight_1) {
        return __awaiter(this, arguments, void 0, function (txId, lastValidBlockHeight, maxRetries) {
            var attempts, status_1, blockHeight, error_7;
            if (maxRetries === void 0) { maxRetries = 15; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        attempts = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempts < maxRetries)) return [3 /*break*/, 9];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, this.connection.getSignatureStatus(txId)];
                    case 3:
                        status_1 = (_a.sent()).value;
                        if (status_1 && (status_1.confirmationStatus === "confirmed" || status_1.confirmationStatus === "finalized")) {
                            return [2 /*return*/, true];
                        }
                        return [4 /*yield*/, this.connection.getBlockHeight()];
                    case 4:
                        blockHeight = _a.sent();
                        if (blockHeight > lastValidBlockHeight) {
                            console.log("Blockhash expired for ".concat(txId, ". Current height: ").concat(blockHeight, ", Last valid: ").concat(lastValidBlockHeight));
                            return [2 /*return*/, false];
                        }
                        attempts++;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 6:
                        error_7 = _a.sent();
                        console.error("Error monitoring transaction ".concat(txId, ":"), error_7);
                        attempts++;
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 1];
                    case 9:
                        console.log("Transaction ".concat(txId, " failed to confirm after ").concat(maxRetries, " attempts"));
                        return [2 /*return*/, false];
                }
            });
        });
    };
    PayPerSecondStream.prototype.withdrawFromStream = function (streamId, wallet, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var txId, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.withdraw({ id: streamId, amount: amount }, { invoker: wallet })];
                    case 1:
                        txId = (_a.sent()).txId;
                        return [2 /*return*/, { success: true, txId: txId }];
                    case 2:
                        error_8 = _a.sent();
                        console.error("Error withdrawing from stream:", error_8);
                        return [2 /*return*/, { success: false, error: error_8 }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PayPerSecondStream.prototype.topupStream = function (streamId, wallet, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var txId, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.topup({ id: streamId, amount: amount }, { invoker: wallet })];
                    case 1:
                        txId = (_a.sent()).txId;
                        return [2 /*return*/, { success: true, txId: txId }];
                    case 2:
                        error_9 = _a.sent();
                        console.error("Error topping up stream:", error_9);
                        return [2 /*return*/, { success: false, error: error_9 }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PayPerSecondStream;
}());
exports.PayPerSecondStream = PayPerSecondStream;
