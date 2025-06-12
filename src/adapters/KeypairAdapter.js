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
exports.KeypairAdapter = void 0;
var wallet_adapter_base_1 = require("@solana/wallet-adapter-base");
var web3_js_1 = require("@solana/web3.js");
var KeypairAdapter = /** @class */ (function () {
    function KeypairAdapter(keypair) {
        var _this = this;
        this.keypair = keypair;
        this.name = "Keypair";
        this.url = "";
        this.icon = "";
        this.readyState = wallet_adapter_base_1.WalletReadyState.Installed;
        this.connecting = false;
        this.connected = true;
        this.publicKey = this.keypair.publicKey;
        this.supportedTransactionVersions = new Set(['legacy', 0]);
        this.connect = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); };
        this.disconnect = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); };
    }
    KeypairAdapter.prototype.getPublicKey = function () {
        return this.keypair.publicKey;
    };
    KeypairAdapter.prototype.eventNames = function () {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.listeners = function (event) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.listenerCount = function (event) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.on = function (event, fn, context) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.addListener = function (event, fn, context) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.once = function (event, fn, context) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.removeListener = function (event, fn, context, once) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.off = function (event, fn, context, once) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.removeAllListeners = function (event) {
        throw new Error("Method not implemented.");
    };
    KeypairAdapter.prototype.signTransaction = function (transaction) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Check if it's a plain object that needs to be converted to Transaction
                if ('sign' in transaction) {
                    transaction.sign([this.keypair]);
                }
                else {
                    transaction.partialSign(this.keypair);
                }
                return [2 /*return*/, transaction];
            });
        });
    };
    // Handle VersionedTransaction and regular Transaction
    // if (transaction instanceof VersionedTransaction) {
    //     transaction.sign([this.keypair]);
    // } else if (transaction instanceof Transaction) {
    //     transaction.partialSign(this.keypair);
    // }
    // return transaction;
    KeypairAdapter.prototype.signAllTransactions = function (transactions) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, Promise.all(transactions.map(function (tx) { return _this.signTransaction(tx); }))];
            });
        });
    };
    KeypairAdapter.prototype.sendTransaction = function (transaction, connection, options) {
        return __awaiter(this, void 0, void 0, function () {
            var signedTx, rawTransaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.signTransaction(transaction)];
                    case 1:
                        signedTx = _a.sent();
                        rawTransaction = 'serialize' in signedTx ? signedTx.serialize() : web3_js_1.Transaction.from(signedTx).serialize();
                        return [2 /*return*/, connection.sendRawTransaction(rawTransaction, options)];
                }
            });
        });
    };
    return KeypairAdapter;
}());
exports.KeypairAdapter = KeypairAdapter;
