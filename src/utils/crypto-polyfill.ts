import { webcrypto } from 'node:crypto';

// Polyfill the Web Crypto API for Node.js
if (!globalThis.crypto) {
  // @ts-ignore
  globalThis.crypto = webcrypto;
}
