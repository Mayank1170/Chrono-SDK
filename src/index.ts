// Main exports for Chrono SDK
export { PayPerSecondStream, StreamState } from './stream/stream.js';
export { StreamState as StreamStateOnly } from './stream/state.js';
export { StreamService } from './stream/streamService.js';
export { ActivityDetector, UserActivityDetector } from './activity/detector.js';
export type { StreamActivityCallbacks } from './activity/detector.js';
export { BrowserActivityDetector } from './activity/browser.js';
export { KeypairAdapter } from './adapters/KeypairAdapter.js';
export * from './core/types.js';

// Re-export commonly used types from dependencies for convenience
export type { SignerWalletAdapter } from '@solana/wallet-adapter-base';
export type { Connection } from '@solana/web3.js';
export { getBN, getNumberFromBN } from '@streamflow/stream';

// Utility imports (crypto polyfill is auto-executed)
import './utils/crypto-polyfill.js';
import { PayPerSecondStream } from './stream/stream.js';

// Version export
export const VERSION = '1.0.0';

// Default configuration helpers
export const DefaultActivityConfig = {
  idleThreshold: 60000, // 1 minute
  detectionInterval: 10000, // 10 seconds
};

// Helper function to create a PayPerSecondStream with common defaults
export function createPayPerSecondStream(
  rpcUrl: string,
  options: {
    ratePerSecond: number;
    tokenDecimals: number;
    tokenId: string;
    recipient: string;
    inactivityTimeoutMs?: number;
    disableInactivityTimeout?: boolean;
  }
) {
  return new PayPerSecondStream(rpcUrl, {
    inactivityTimeoutMs: options.inactivityTimeoutMs || 60000,
    ratePerSecond: options.ratePerSecond,
    tokenDecimals: options.tokenDecimals,
    tokenId: options.tokenId,
    recipient: options.recipient,
    disableInactivityTimeout: options.disableInactivityTimeout || false,
  });
}
