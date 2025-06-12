"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.BrowserActivityDetector = void 0;
var detector_js_1 = require("./detector.js");
// Default events to track for user activity
var DEFAULT_ACTIVITY_EVENTS = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'visibilitychange',
];
/**
 * Activity detector implementation for browser environments
 */
var BrowserActivityDetector = /** @class */ (function (_super) {
    __extends(BrowserActivityDetector, _super);
    function BrowserActivityDetector() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.lastActivityTime = Date.now();
        _this.checkInterval = null;
        _this.boundEventHandlers = new Map();
        return _this;
    }
    /**
     * Start monitoring for activity
     */
    BrowserActivityDetector.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var events;
            var _this = this;
            return __generator(this, function (_a) {
                if (this.isRunning) {
                    return [2 /*return*/];
                }
                try {
                    // Verify we're in a browser environment
                    if (typeof window === 'undefined' || typeof document === 'undefined') {
                        throw new Error('Activity detection requires a browser environment');
                    }
                    events = this.config.activityEvents || DEFAULT_ACTIVITY_EVENTS;
                    events.forEach(function (eventName) {
                        var handler = _this.handleUserActivity.bind(_this);
                        _this.boundEventHandlers.set(eventName, handler);
                        // Add the event listener
                        if (eventName === 'visibilitychange') {
                            document.addEventListener(eventName, handler);
                        }
                        else {
                            window.addEventListener(eventName, handler);
                        }
                    });
                    // Start the idle check interval
                    this.checkInterval = setInterval(this.checkIdleStatus.bind(this), this.config.detectionInterval);
                    this.isRunning = true;
                    this.emit('detector:started');
                    console.log('[ActivityDetector] Started monitoring user activity');
                }
                catch (error) {
                    console.error('[ActivityDetector] Failed to start:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Stop monitoring for activity
     */
    BrowserActivityDetector.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.isRunning) {
                    return [2 /*return*/];
                }
                try {
                    // Clear the check interval
                    if (this.checkInterval) {
                        clearInterval(this.checkInterval);
                        this.checkInterval = null;
                    }
                    // Remove event listeners
                    this.boundEventHandlers.forEach(function (handler, eventName) {
                        if (eventName === 'visibilitychange') {
                            document.removeEventListener(eventName, handler);
                        }
                        else {
                            window.removeEventListener(eventName, handler);
                        }
                    });
                    this.boundEventHandlers.clear();
                    this.isRunning = false;
                    this.emit('detector:stopped');
                    console.log('[ActivityDetector] Stopped monitoring user activity');
                }
                catch (error) {
                    console.error('[ActivityDetector] Failed to stop:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Handle user activity events
     */
    BrowserActivityDetector.prototype.handleUserActivity = function (event) {
        // For visibility change, only consider it activity if becoming visible
        if (event.type === 'visibilitychange') {
            if (document.visibilityState === 'visible') {
                this.recordActivity();
            }
            return;
        }
        // Record activity for all other events
        this.recordActivity();
    };
    /**
     * Record user activity
     */
    BrowserActivityDetector.prototype.recordActivity = function () {
        var _this = this;
        var now = Date.now();
        var wasIdle = now - this.lastActivityTime > this.config.idleThreshold;
        this.lastActivityTime = now;
        if (wasIdle) {
            console.log('[ActivityDetector] User returned from idle state');
            // Notify all bound streams that the user is active again
            this.streamCallbacks.forEach(function (callbacks, streamId) {
                try {
                    callbacks.onActive();
                    _this.emit('activity:active', streamId);
                }
                catch (error) {
                    console.error("[ActivityDetector] Error in onActive callback for stream ".concat(streamId, ":"), error);
                }
            });
        }
    };
    /**
     * Check if the user has gone idle
     */
    BrowserActivityDetector.prototype.checkIdleStatus = function () {
        var _this = this;
        var now = Date.now();
        var timeSinceLastActivity = now - this.lastActivityTime;
        // Check if user has gone idle
        if (timeSinceLastActivity > this.config.idleThreshold && this.streamCallbacks.size > 0) {
            console.log("[ActivityDetector] User idle for ".concat(Math.floor(timeSinceLastActivity / 1000), "s"));
            // Notify all bound streams that the user is idle
            this.streamCallbacks.forEach(function (callbacks, streamId) {
                try {
                    callbacks.onIdle();
                    _this.emit('activity:idle', streamId);
                }
                catch (error) {
                    console.error("[ActivityDetector] Error in onIdle callback for stream ".concat(streamId, ":"), error);
                }
            });
        }
    };
    return BrowserActivityDetector;
}(detector_js_1.ActivityDetector));
exports.BrowserActivityDetector = BrowserActivityDetector;
