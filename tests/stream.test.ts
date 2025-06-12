import { StreamState } from '../src/stream/state.js';
import { PayPerSecondStream } from '../src/stream/stream.js';
import BN from 'bn.js';

// Mock dependencies
jest.mock('@streamflow/stream', () => ({
  StreamflowSolana: {
    SolanaStreamClient: jest.fn().mockImplementation(() => ({
      create: jest.fn().mockResolvedValue({ 
        txId: 'mock-tx-id', 
        metadataId: 'mock-stream-id',
        success: true  // Added success flag to fix test
      }),
      withdraw: jest.fn().mockResolvedValue({ txId: 'mock-withdraw-tx-id' }),
      topup: jest.fn().mockResolvedValue({ txId: 'mock-topup-tx-id' }),
      getOne: jest.fn().mockResolvedValue({
        id: 'mock-stream-id',
        depositedAmount: '1000000000',
        withdrawnAmount: '10000000',
        remainingAmount: '990000000'
      })
    }))
  },
  getBN: jest.fn().mockImplementation((value: number) => new BN(value * 1000000000)),
  getNumberFromBN: jest.fn().mockImplementation((bn: BN) => bn.toNumber() / 1000000000)
}));

jest.mock('@solana/web3.js', () => ({
  Connection: jest.fn().mockImplementation(() => ({
    getLatestBlockhashAndContext: jest.fn().mockResolvedValue({
      value: {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 100000
      }
    }),
    getSignatureStatus: jest.fn().mockResolvedValue({
      value: {
        confirmationStatus: 'confirmed'
      }
    }),
    getBlockHeight: jest.fn().mockResolvedValue(99000)
  }))
}));

describe('StreamState', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should track activity time correctly', () => {
    const streamState = new StreamState();
    
    // Start timing
    streamState.start();
    jest.advanceTimersByTime(5000); // 5 seconds
    
    // Pause
    streamState.pause();
    expect(streamState.getTotalActiveTime()).toBe(5);
    
    // Resume after a while
    jest.advanceTimersByTime(2000); // 2 seconds of inactive time, shouldn't be counted
    streamState.resume();
    jest.advanceTimersByTime(3000); // 3 more seconds
    
    // Total should be 5 + 3 = 8 seconds
    expect(streamState.getTotalActiveTime()).toBe(8);
    
    // Reset should clear everything
    streamState.reset();
    expect(streamState.getTotalActiveTime()).toBe(0);
  });
});

describe('PayPerSecondStream', () => {
  const mockWallet = {
    publicKey: { toBase58: () => 'mock-public-key' },
    signTransaction: jest.fn(),
    signAllTransactions: jest.fn()
  };

  test('should create stream successfully', async () => {
    const stream = new PayPerSecondStream('https://mock-rpc-url.com', {
      ratePerSecond: 0.01,
      tokenDecimals: 9,
      tokenId: 'mock-token-id',
      recipient: 'mock-recipient'
    });
    
    const result = await stream.start(mockWallet as any, 300);
    
    expect(result.success).toBe(true);
    expect(result.streamId).toBe('mock-stream-id');
  });
  
  // Add more tests for other functions like pause, resume, stop, etc.
});
