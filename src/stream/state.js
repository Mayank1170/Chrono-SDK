"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamState = void 0;
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
