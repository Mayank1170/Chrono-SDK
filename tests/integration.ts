/**
 * Chrono SDK Integration Test
 * 
 * This script tests the full end-to-end flow of the SDK against Solana devnet.
 * 
 * IMPORTANT: To run this integration test properly:
 * 1. Create a funded Solana wallet on devnet
 * 2. Save the private key in .env as WALLET_PRIVATE_KEY=your_base58_private_key
 * 3. Run with: npx tsx tests/integration.ts
 * 
 * WARNING: This will use real SOL from your test wallet!
 */

import { createPayPerSecondStream, KeypairAdapter } from '../src/index.js';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config();

// Set up Solana connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Function to request an airdrop and confirm it
async function requestAirdrop(address: PublicKey, amount: number = 1): Promise<boolean> {
  try {
    console.log(`✨ Requesting ${amount} SOL airdrop for ${address.toString()}...`);
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
async function checkAndFundWallet(address: PublicKey): Promise<boolean> {
  console.log('🔍 Checking wallet balance...');
  const balance = await connection.getBalance(address);
  console.log(`💰 Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  
  if (balance < 0.5 * LAMPORTS_PER_SOL) {
    console.log('💎 Wallet needs funding, requesting airdrop...');
    const success = await requestAirdrop(address, 1);
    
    if (success) {
      // Check balance again after airdrop
      const newBalance = await connection.getBalance(address);
      console.log(`💰 New balance: ${newBalance / LAMPORTS_PER_SOL} SOL`);
      return true;
    }
    return false;
  } else {
    console.log('✅ Wallet is already funded!');
    return true;
  }
}

// Set up wallet - either from .env or generate a new one
let testKeypair: Keypair;
let hasRealWallet = false;

if (process.env.WALLET_PRIVATE_KEY) {
  try {
    // Convert base58 private key to Uint8Array for Keypair
    const privateKeyBase58 = process.env.WALLET_PRIVATE_KEY;
    
    // We don't have bs58 installed, so using a simpler approach
    // In a real project, use: import bs58 from 'bs58';
    testKeypair = Keypair.fromSecretKey(
      Uint8Array.from(privateKeyBase58.split(',').map(Number))
    );
    hasRealWallet = true;
  } catch (error) {
    console.error('⚠️ Error loading wallet from WALLET_PRIVATE_KEY:', error);
    console.log('Falling back to generated keypair');
    testKeypair = Keypair.generate();
  }
} else {
  // Fallback to generated keypair for demo purposes
  testKeypair = Keypair.generate();
}

const wallet = new KeypairAdapter(testKeypair);

// Get recipient from .env or use a default
const RECIPIENT = process.env.TEST_RECIPIENT || 'GJR8QhLcvqui6aPMXz1fE8wMxrJpFsyJeN9Npw5oSQcd';

console.log('🧪 Running Chrono SDK Integration Test');
console.log('👛 Test wallet address:', testKeypair.publicKey.toString());

if (!hasRealWallet) {
  console.log('\n⚠️ ATTENTION: Using a GENERATED wallet with NO FUNDS');
  console.log('Transactions will fail because the wallet has 0 SOL');
  console.log('\nTo run a proper test:');
  console.log('1. Create a funded Solana wallet (solana-keygen new)');
  console.log('2. Fund it on devnet (solana airdrop 1)');
  console.log('3. Create a .env file with WALLET_PRIVATE_KEY=your_base58_private_key');
  console.log('');
}

async function runTest() {
  try {
    // First check if the wallet has funds and attempt an airdrop if needed
    const funded = await checkAndFundWallet(testKeypair.publicKey);
    
    if (!funded) {
      console.log('⚠️ Could not fund wallet. The test will likely fail.');
      console.log('Try running this test when Solana devnet airdrops are available.');
    }

    console.log('🔄 Creating stream...');
    
    // Create the stream with minimal configuration and very low rate to save SOL
    const stream = createPayPerSecondStream('https://api.devnet.solana.com', {
      ratePerSecond: 0.0000001, // Tiny amount for testing
      tokenDecimals: 9,        // SOL has 9 decimals
      tokenId: 'So11111111111111111111111111111111111111112', // SOL
      recipient: RECIPIENT,
      inactivityTimeoutMs: 5000, // Short timeout for testing
    });

    console.log('▶️ Starting stream...');
    const startResult = await stream.start(wallet, 10); // Short 10-second duration
    
    if (!startResult.success) {
      throw new Error(`Failed to start stream: ${startResult.error}`);
    }
    
    console.log('✅ Stream started:', startResult.streamId);
    
    // Wait a bit
    console.log('⏱️ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check status
    const status = await stream.getStreamStatus();
    console.log('📊 Stream status:', status);
    
    // Pause
    console.log('⏸️ Pausing...');
    stream.pause();
    
    // Wait a bit more
    console.log('⏱️ Waiting 2 more seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Resume
    console.log('▶️ Resuming...');
    const resumeResult = await stream.resume(wallet, 5); // Add 5 more seconds
    
    if (!resumeResult.success) {
      throw new Error(`Failed to resume stream: ${resumeResult.error}`);
    }
    
    console.log('✅ Stream resumed');
    
    // Final status
    const finalStatus = await stream.getStreamStatus();
    console.log('📊 Final status:', finalStatus);
    
    // Stop
    console.log('⏹️ Stopping...');
    const stopResult = await stream.stop(wallet);
    
    if (!stopResult.success) {
      throw new Error(`Failed to stop stream: ${stopResult.error}`);
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Only run if we have SOL to test with
console.log('⚠️ WARNING: This test requires SOL on devnet to work.');
console.log('Press Ctrl+C now to abort, or wait 5 seconds to continue...');

setTimeout(runTest, 5000);
