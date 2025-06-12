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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserActivityDetector = exports.ActivityDetector = void 0;
var events_1 = require("events");
// Base abstract class for activity detectors
var ActivityDetector = /** @class */ (function (_super) {
    __extends(ActivityDetector, _super);
    function ActivityDetector(config) {
        var _this = _super.call(this) || this;
        _this.streamCallbacks = new Map();
        _this.isRunning = false;
        _this.config = config;
        return _this;
    }
    //update the activity configuration
    ActivityDetector.prototype.updateConfig = function (config) {
        this.config = __assign(__assign({}, this.config), config);
        // Emit config updated event
        this.emit("config:updated", this.config);
    };
    /**
     * Bind activity detection to a specific stream
     */
    ActivityDetector.prototype.bindToStream = function (streamId, callbacks) {
        this.streamCallbacks.set(streamId, callbacks);
        this.emit("stream:bound", streamId);
    };
    /**
     * Unbind activity detection from a stream
     */
    ActivityDetector.prototype.unbindFromStream = function (streamId) {
        this.streamCallbacks.delete(streamId);
        this.emit("stream:unbound", streamId);
    };
    /**
     * Check if activity detection is bound to a stream
     */
    ActivityDetector.prototype.isBoundToStream = function (streamId) {
        return this.streamCallbacks.has(streamId);
    };
    return ActivityDetector;
}(events_1.EventEmitter));
exports.ActivityDetector = ActivityDetector;
var UserActivityDetector = /** @class */ (function () {
    /**
     * Create a new UserActivityDetector
     *
     * @param options - Configuration options
     * @param options.inactivityTimeoutMs - Time in milliseconds before considering a user inactive
     * @param options.onInactive - Callback when user becomes inactive
     * @param options.onActive - Callback when user becomes active again
     * @param options.checkIntervalMs - How often to check for inactivity
     */
    function UserActivityDetector(options) {
        var _this = this;
        this.isActive = true;
        this.activityCheckInterval = null;
        /**
         * Handle user activity events
         */
        this.handleActivity = function () {
            _this.lastActivityTime = Date.now();
            if (!_this.isActive) {
                _this.isActive = true;
                _this.onActive();
            }
        };
        this.lastActivityTime = Date.now();
        this.inactivityTimeout = options.inactivityTimeoutMs;
        this.onInactive = options.onInactive;
        this.onActive = options.onActive;
        // Only setup event listeners if in a browser environment
        if (typeof window !== 'undefined') {
            this.setupEventListeners();
            // Start the activity checking interval
            this.activityCheckInterval = setInterval(this.checkActivity.bind(this), options.checkIntervalMs || 10000 // Default: check every 10 seconds
            );
        }
    }
    /**
     * Set up all browser event listeners for activity detection
     */
    UserActivityDetector.prototype.setupEventListeners = function () {
        var _this = this;
        // Basic activity events
        window.addEventListener('mousemove', this.handleActivity);
        window.addEventListener('mousedown', this.handleActivity);
        window.addEventListener('keypress', this.handleActivity);
        window.addEventListener('touchstart', this.handleActivity);
        window.addEventListener('scroll', this.handleActivity);
        // Additional events for better detection
        window.addEventListener('click', this.handleActivity);
        window.addEventListener('focus', this.handleActivity);
        window.addEventListener('blur', function () {
            // Consider blur as potential inactivity, but don't immediately trigger
            setTimeout(_this.checkActivity.bind(_this), _this.inactivityTimeout / 2);
        });
        // Handle visibility change
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                _this.handleActivity();
            }
            else {
                // Tab is hidden, check soon for inactivity
                setTimeout(_this.checkActivity.bind(_this), _this.inactivityTimeout / 2);
            }
        });
        // Video/audio specific events for media consumption
        document.addEventListener('play', this.handleActivity, true);
        document.addEventListener('pause', this.handleActivity, true);
        // Handle page unload/close
        window.addEventListener('beforeunload', function () {
            _this.cleanup();
        });
    };
    /**
     * Check if user is inactive based on timeout
     */
    UserActivityDetector.prototype.checkActivity = function () {
        var now = Date.now();
        var inactiveTime = now - this.lastActivityTime;
        if (inactiveTime >= this.inactivityTimeout && this.isActive) {
            this.isActive = false;
            this.onInactive();
        }
    };
    /**
     * Update inactivity timeout
     *
     * @param timeoutMs - New timeout in milliseconds
     */
    UserActivityDetector.prototype.updateInactivityTimeout = function (timeoutMs) {
        this.inactivityTimeout = timeoutMs;
    };
    /**
     * Force an activity update
     */
    UserActivityDetector.prototype.forceActivity = function () {
        this.handleActivity();
    };
    /**
     * Check if user is currently considered active
     */
    UserActivityDetector.prototype.getIsActive = function () {
        return this.isActive;
    };
    /**
     * Get time elapsed since last activity in milliseconds
     */
    UserActivityDetector.prototype.getTimeSinceLastActivity = function () {
        return Date.now() - this.lastActivityTime;
    };
    /**
     * Clean up all event listeners
     */
    UserActivityDetector.prototype.cleanup = function () {
        if (typeof window !== 'undefined') {
            window.removeEventListener('mousemove', this.handleActivity);
            window.removeEventListener('mousedown', this.handleActivity);
            window.removeEventListener('keypress', this.handleActivity);
            window.removeEventListener('touchstart', this.handleActivity);
            window.removeEventListener('scroll', this.handleActivity);
            window.removeEventListener('click', this.handleActivity);
            window.removeEventListener('focus', this.handleActivity);
            document.removeEventListener('visibilitychange', this.handleActivity);
            document.removeEventListener('play', this.handleActivity, true);
            document.removeEventListener('pause', this.handleActivity, true);
            if (this.activityCheckInterval) {
                clearInterval(this.activityCheckInterval);
                this.activityCheckInterval = null;
            }
        }
    };
    return UserActivityDetector;
}());
exports.UserActivityDetector = UserActivityDetector;
