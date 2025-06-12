"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultActivityConfig = exports.VERSION = exports.getNumberFromBN = exports.getBN = exports.KeypairAdapter = exports.BrowserActivityDetector = exports.UserActivityDetector = exports.ActivityDetector = exports.StreamService = exports.StreamStateOnly = exports.StreamState = exports.PayPerSecondStream = void 0;
exports.createPayPerSecondStream = createPayPerSecondStream;
// Main exports for Chrono SDK
var stream_js_1 = require("./stream/stream.js");
Object.defineProperty(exports, "PayPerSecondStream", { enumerable: true, get: function () { return stream_js_1.PayPerSecondStream; } });
Object.defineProperty(exports, "StreamState", { enumerable: true, get: function () { return stream_js_1.StreamState; } });
var state_js_1 = require("./stream/state.js");
Object.defineProperty(exports, "StreamStateOnly", { enumerable: true, get: function () { return state_js_1.StreamState; } });
var streamService_js_1 = require("./stream/streamService.js");
Object.defineProperty(exports, "StreamService", { enumerable: true, get: function () { return streamService_js_1.StreamService; } });
var detector_js_1 = require("./activity/detector.js");
Object.defineProperty(exports, "ActivityDetector", { enumerable: true, get: function () { return detector_js_1.ActivityDetector; } });
Object.defineProperty(exports, "UserActivityDetector", { enumerable: true, get: function () { return detector_js_1.UserActivityDetector; } });
var browser_js_1 = require("./activity/browser.js");
Object.defineProperty(exports, "BrowserActivityDetector", { enumerable: true, get: function () { return browser_js_1.BrowserActivityDetector; } });
var KeypairAdapter_js_1 = require("./adapters/KeypairAdapter.js");
Object.defineProperty(exports, "KeypairAdapter", { enumerable: true, get: function () { return KeypairAdapter_js_1.KeypairAdapter; } });
__exportStar(require("./core/types.js"), exports);
var stream_1 = require("@streamflow/stream");
Object.defineProperty(exports, "getBN", { enumerable: true, get: function () { return stream_1.getBN; } });
Object.defineProperty(exports, "getNumberFromBN", { enumerable: true, get: function () { return stream_1.getNumberFromBN; } });
// Utility imports (crypto polyfill is auto-executed)
require("./utils/crypto-polyfill.js");
var stream_js_2 = require("./stream/stream.js");
// Version export
exports.VERSION = '1.0.0';
// Default configuration helpers
exports.DefaultActivityConfig = {
    idleThreshold: 60000, // 1 minute
    detectionInterval: 10000, // 10 seconds
};
// Helper function to create a PayPerSecondStream with common defaults
function createPayPerSecondStream(rpcUrl, options) {
    return new stream_js_2.PayPerSecondStream(rpcUrl, {
        inactivityTimeoutMs: options.inactivityTimeoutMs || 60000,
        ratePerSecond: options.ratePerSecond,
        tokenDecimals: options.tokenDecimals,
        tokenId: options.tokenId,
        recipient: options.recipient,
        disableInactivityTimeout: options.disableInactivityTimeout || false,
    });
}
