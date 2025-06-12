# Chrono SDK: Per-Second Payment Streaming on Solana

Chrono SDK enables per-second token streaming on Solana using [Streamflow](https://streamflow.finance/). It provides easy-to-use classes and utilities to integrate real-time payment features into your dApps, perfect for subscriptions, payroll, usage-based billing, and more.

## Features

- 🚀 **Per-second streaming**: Stream tokens at precise rates (e.g., 0.01 tokens/second)
- ⏯️ **Stream control**: Start, pause, resume, and stop streams programmatically
- 🎯 **Activity detection**: Automatic pause/resume based on user activity
- 💰 **Flexible withdrawals**: Manual and automatic withdrawal options
- 🔧 **Developer friendly**: TypeScript support with comprehensive type definitions
- 🌐 **Cross-platform**: Works in browser and Node.js environments

## Installation

```bash
npm install chrono-sdk
```

## Quick Start

### Basic Usage

```typescript
import { createPayPerSecondStream, KeypairAdapter } from 'chrono-sdk';
import { Keypair } from '@solana/web3.js';

// Create a wallet adapter
const keypair = Keypair.generate(); // In practice, load from your wallet
const wallet = new KeypairAdapter(keypair);

// Create a pay-per-second stream
const stream = createPayPerSecondStream('https://api.devnet.solana.com', {
  ratePerSecond: 0.01, // 0.01 tokens per second
  tokenDecimals: 9, // SOL has 9 decimals
  tokenId: 'So11111111111111111111111111111111111111112', // SOL token mint
  recipient: 'RECIPIENT_WALLET_ADDRESS',
  inactivityTimeoutMs: 60000, // Pause after 1 minute of inactivity
});

// Start streaming
const result = await stream.start(wallet, 300); // 300 seconds initial duration
if (result.success) {
  console.log('Stream started:', result.streamId);
}

// Get stream status
const status = await stream.getStreamStatus();
console.log('Active time:', status.activeTimeSeconds, 'seconds');
console.log('Total cost:', status.totalCost);

// Stop streaming
const stopResult = await stream.stop(wallet);
if (stopResult.success) {
  console.log('Stream stopped successfully');
}
```

### Advanced Usage with Activity Detection

```typescript
import { PayPerSecondStream, BrowserActivityDetector, DefaultActivityConfig } from 'chrono-sdk';

// Create stream with custom activity detection
const stream = new PayPerSecondStream('https://api.devnet.solana.com', {
  ratePerSecond: 0.01,
  tokenDecimals: 9,
  tokenId: 'TOKEN_MINT_ADDRESS',
  recipient: 'RECIPIENT_ADDRESS',
  inactivityTimeoutMs: 30000, // 30 seconds
  disableInactivityTimeout: false,
});

// Set up browser-based activity detection
const activityDetector = new BrowserActivityDetector({
  ...DefaultActivityConfig,
  idleThreshold: 30000, // 30 seconds
});

// Bind activity detection to the stream
activityDetector.bindToStream('my-stream', {
  onIdle: () => {
    console.log('User went idle - stream will pause');
    stream.pause();
  },
  onActive: () => {
    console.log('User became active - resuming stream');
    stream.resume(wallet, 60); // Resume with 60 seconds
  },
});

// Start activity monitoring
await activityDetector.start();
```

## API Reference

### Core Classes

#### `PayPerSecondStream`
The main class for managing per-second payment streams.

**Constructor Options:**
- `ratePerSecond`: Token amount per second
- `tokenDecimals`: Number of decimals for the token
- `tokenId`: Token mint address
- `recipient`: Recipient wallet address
- `inactivityTimeoutMs`: Milliseconds before pausing due to inactivity
- `disableInactivityTimeout`: Whether to disable automatic pausing

**Methods:**
- `start(wallet, duration)`: Start a new stream
- `pause()`: Pause the current stream
- `resume(wallet, duration)`: Resume or extend the stream
- `stop(wallet)`: Stop and cancel the stream
- `getStreamStatus()`: Get current stream information

#### `ActivityDetector` Classes
- `BrowserActivityDetector`: Detects user activity in browser environments
- `UserActivityDetector`: Basic activity detection utility

#### `KeypairAdapter`
Wallet adapter for using Solana Keypairs with the Streamflow SDK.

### Utility Functions

#### `createPayPerSecondStream(rpcUrl, options)`
Helper function to create a `PayPerSecondStream` with common defaults.

### Constants

#### `DefaultActivityConfig`
Default configuration for activity detection:
```typescript
{
  idleThreshold: 60000, // 1 minute
  detectionInterval: 10000, // 10 seconds
}
```

## Examples

Check out the `examples/` directory for complete working examples:

- **Basic streaming**: Simple start/stop functionality
- **Activity detection**: Automatic pause/resume based on user activity
- **Custom configurations**: Advanced stream setup

## Development

### Building from Source

```bash
git clone https://github.com/chrono-finance/chrono.git
cd chrono
npm install
npm run build
```

### Running Examples

```bash
npm run build
npx tsx examples/create-stream-demo.ts
```

## Requirements

- Node.js 16+ or modern browser
- Solana wallet adapter
- RPC endpoint (Devnet/Mainnet)

## License

MIT License

## Resources

- [Streamflow Documentation](https://docs.streamflow.finance/)
- [Solana Documentation](https://docs.solana.com/)
- [Chrono Examples](./examples/)
