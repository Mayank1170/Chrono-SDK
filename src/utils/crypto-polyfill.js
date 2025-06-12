"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var node_crypto_1 = require("node:crypto");
// Polyfill the Web Crypto API for Node.js
if (!globalThis.crypto) {
    // @ts-ignore
    globalThis.crypto = node_crypto_1.webcrypto;
}
