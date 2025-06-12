/**
 * Example demonstrating how to use the Chrono SDK
 * This shows the basic workflow for setting up pay-per-second streaming
 * 
 * IMPORTANT: To run this example, you need a funded wallet on Solana devnet.
 * You would typically load a real keypair from a file or environment variable.
 */

import { createPayPerSecondStream, KeypairAdapter, BrowserActivityDetector, DefaultActivityConfig } from '../src/index.js';
import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Retry utility function - same as in create-stream-demo.ts
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 10,
  retryDelayMs: number = 1000
): Promise<T> {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt + 1} failed: ${error}. Retrying in ${retryDelayMs / 1000}s... (${maxRetries - attempt - 1} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  throw lastError;
}

// Set up Solana connection
const rpcUrl = process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";
const connection = new Connection(rpcUrl, {
  commitment: "confirmed",
  disableRetryOnRateLimit: false,
});

// Set up wallet - Generate a new keypair or load from .env
let keypair: Keypair;
if (process.env.WALLET_PRIVATE_KEY) {
  try {
    const privateKeyString = process.env.WALLET_PRIVATE_KEY;
    const privateKeyArray = JSON.parse(privateKeyString);
    keypair = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    console.log('\u2705 Using wallet from environment variable');
  } catch (error) {
    console.error('\u26a0\ufe0f Error parsing private key:', error);
    keypair = Keypair.generate();
  }
} else {
  keypair = Keypair.generate();
  console.log('\u2139\ufe0f No private key found in .env, generated a new keypair');
}

const wallet = new KeypairAdapter(keypair);

// Function to request an airdrop and confirm it
async function requestAirdrop(address: PublicKey, amount: number = 1): Promise<boolean> {
  try {
    console.log(`🪙 Requesting ${amount} SOL airdrop for ${address.toString()}...`);
    const signature = await connection.requestAirdrop(address, amount * LAMPORTS_PER_SOL);
    
    // Wait for confirmation
    console.log('⏳ Confirming transaction...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
    
    console.log('✅ Airdrop successful!');
    return true;
  } catch (error) {
    console.error('❌ Airdrop failed:', error);
    return false;
  }
}

// Check balance and airdrop if needed
async function checkAndFundWallet(): Promise<void> {
  console.log('🔍 Checking wallet balance...');
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(`💰 Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log('🪙 Wallet needs funding, requesting airdrop...');
    await withRetry(() => requestAirdrop(keypair.publicKey, 1));
    
    // Check balance again after airdrop
    const newBalance = await connection.getBalance(keypair.publicKey);
    console.log(`💰 New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
  } else {
    console.log('✅ Wallet is already funded!');
  }
}

console.log('🚀 CHRONO SDK EXAMPLE');
console.log('👛 Using wallet address:', keypair.publicKey.toString());
console.log('');


// Configuration
const RPC_URL = 'https://api.devnet.solana.com';
// Using a valid Solana address as the recipient
const RECIPIENT_ADDRESS = 'JDCUs2MJ7kbvi5kBQ7Jeo5yEtXMSBfT23PKg8wj6uPdC';
const SOL_TOKEN_MINT = 'So11111111111111111111111111111111111111112';

async function demonstrateBasicStreaming() {
  // First make sure our wallet has some SOL for transactions
  await checkAndFundWallet();
  
  console.log('🚀 Creating pay-per-second stream...');
  
  // Create a stream that charges 0.01 SOL per second
  const stream = createPayPerSecondStream(RPC_URL, {
    ratePerSecond: 0.001, // 0.001 SOL per second (reduced rate to save SOL)
    tokenDecimals: 9, // SOL has 9 decimals
    tokenId: SOL_TOKEN_MINT,
    recipient: RECIPIENT_ADDRESS,
    inactivityTimeoutMs: 60000, // Pause after 1 minute of inactivity
  });

  try {
    // Start the stream with 5 minutes initial duration
    console.log('▶️ Starting stream...');
    const startResult = await stream.start(wallet, 300); // 300 seconds = 5 minutes
    
    if (startResult.success) {
      console.log('✅ Stream started successfully!');
      console.log('📋 Stream ID:', startResult.streamId);
      
      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      // Check stream status
      const status = await stream.getStreamStatus();
      console.log('📊 Stream Status:');
      console.log('  - Active time:', status.activeTimeSeconds, 'seconds');
      console.log('  - Total cost:', status.totalCost, 'SOL');
      console.log('  - Is running:', status.isRunning);
      
      // Pause the stream
      console.log('⏸️ Pausing stream...');
      stream.pause();
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Resume the stream
      console.log('▶️ Resuming stream...');
      const resumeResult = await stream.resume(wallet, 120); // Add 2 more minutes
      
      if (resumeResult.success) {
        console.log('✅ Stream resumed successfully!');
      }
      
      // Final status check
      const finalStatus = await stream.getStreamStatus();
      console.log('📊 Final Status:');
      console.log('  - Active time:', finalStatus.activeTimeSeconds, 'seconds');
      console.log('  - Total cost:', finalStatus.totalCost, 'SOL');
      
      // Stop the stream
      console.log('⏹️ Stopping stream...');
      const stopResult = await stream.stop(wallet);
      
      if (stopResult.success) {
        console.log('✅ Stream stopped successfully!');
      }
      
    } else {
      console.error('❌ Failed to start stream:', startResult.error);
    }
    
  } catch (error) {
    console.error('❌ Error during stream operation:', error);
  }
}

async function demonstrateActivityDetection() {
  console.log('\n🎯 Demonstrating activity detection...');
  
  // Note: This would work in a browser environment
  if (typeof window !== 'undefined') {
    const activityDetector = new BrowserActivityDetector({
      ...DefaultActivityConfig,
      idleThreshold: 30000, // 30 seconds
    });
    
    const stream = createPayPerSecondStream(RPC_URL, {
      ratePerSecond: 0.005,
      tokenDecimals: 9,
      tokenId: SOL_TOKEN_MINT,
      recipient: RECIPIENT_ADDRESS,
      disableInactivityTimeout: true, // We'll handle this ourselves
    });
    
    // Bind activity detection to stream
    activityDetector.bindToStream('demo-stream', {
      onIdle: () => {
        console.log('😴 User went idle - pausing stream');
        stream.pause();
      },
      onActive: () => {
        console.log('👀 User became active - resuming stream');
        stream.resume(wallet, 60);
      },
    });
    
    // Start activity monitoring
    await activityDetector.start();
    console.log('✅ Activity detection started!');
    
    // In a real app, the stream would automatically pause/resume based on user activity
  } else {
    console.log('ℹ️ Activity detection requires a browser environment');
  }
}

// Run the examples
async function main() {
  console.log('🎬 Chrono SDK Demo');
  console.log('==================\n');
  
  await demonstrateBasicStreaming();
  await demonstrateActivityDetection();
  
  console.log('\n🎉 Demo completed!');
}

// Run the demo automatically
main().catch(console.error);

export { main };

