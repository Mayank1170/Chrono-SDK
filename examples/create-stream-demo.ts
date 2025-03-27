import '../src/utils/crypto-polyfill';
import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, createMintToInstruction } from "@solana/spl-token";
import { PayPerSecondStream } from "./../src/stream/stream";
import { KeypairAdapter } from "../src/adapters/KeypairAdapter";
import * as dotenv from 'dotenv';
import BN from "bn.js";

dotenv.config();

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 10, // Increased from 5
  retryDelayMs: number = 1000 // Increased from 500
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

async function testWithKeypair() {
  console.log("Testing with Keypair");

  const rpcUrl = process.env.RPC_ENDPOINT || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, {
    commitment: "confirmed",
    disableRetryOnRateLimit: false,
  });

  let wallet: Keypair;
  if (process.env.WALLET_PRIVATE_KEY) {
    try {
      const privateKeyString = process.env.WALLET_PRIVATE_KEY;
      const privateKeyArray = JSON.parse(privateKeyString);
      wallet = Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
    } catch (error) {
      console.error("Error parsing private key:", error);
      wallet = Keypair.generate();
    }
  } else {
    wallet = Keypair.generate();
    console.log("No private key found in .env, generated a new keypair");
  }

  console.log("Wallet address:", wallet.publicKey.toString());
  const balance = await withRetry(() => connection.getBalance(wallet.publicKey));
  console.log("Current balance:", balance / LAMPORTS_PER_SOL, "SOL");

  const walletAdapter = new KeypairAdapter(wallet);

  if (balance < LAMPORTS_PER_SOL) {
    console.log("Requesting SOL airdrop from Devnet...");
    try {
      const airdropSignature = await withRetry(() =>
        connection.requestAirdrop(wallet.publicKey, 2 * LAMPORTS_PER_SOL)
      );
      await withRetry(() => connection.confirmTransaction(airdropSignature));
      console.log("Airdrop received");
      const newBalance = await withRetry(() => connection.getBalance(wallet.publicKey));
      console.log("Updated balance:", newBalance / LAMPORTS_PER_SOL, "SOL");
    } catch (error) {
      console.error("Failed to request airdrop:", error);
      throw new Error("Insufficient SOL balance and airdrop failed");
    }
  }

  console.log("Creating test token...");
  const mint = await withRetry(async () => {
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      null,
      6,
      undefined,
      { commitment: "confirmed", skipPreflight: false }
    );
    console.log(`Mint created with public key: ${mint.toString()}`);
    return mint;
  });

  const senderATA = await withRetry(() =>
    getOrCreateAssociatedTokenAccount(connection, wallet, mint, wallet.publicKey)
  );

  async function mintToWithRetry(
    connection: Connection,
    payer: Keypair,
    mint: PublicKey,
    destination: PublicKey,
    authority: Keypair,
    amount: number,
    maxRetries: number = 5
  ): Promise<void> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const { value: { blockhash, lastValidBlockHeight } } = await connection.getLatestBlockhashAndContext("confirmed");
        const transaction = new Transaction({ blockhash, lastValidBlockHeight, feePayer: payer.publicKey });
        transaction.add(
          createMintToInstruction(
            mint,
            destination,
            authority.publicKey,
            amount
          )
        );
        const signature = await sendAndConfirmTransaction(connection, transaction, [payer], {
          commitment: "confirmed",
          skipPreflight: false,
          maxRetries: 0
        });
        console.log(`Mint transaction confirmed with signature: ${signature}`);
        return;
      } catch (error) {
        if (error instanceof Error && error.message.includes("block height exceeded")) {
          const backoffTime = 500 * Math.pow(2, attempt);
          console.log(`Mint transaction expired (attempt ${attempt + 1}/${maxRetries}): ${error}. Retrying in ${backoffTime / 1000}s... (${maxRetries - attempt - 1} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
        throw error;
      }
    }
    throw new Error("Failed to mint tokens after maximum retries");
  }

  await mintToWithRetry(
    connection,
    wallet,
    mint,
    senderATA.address,
    wallet,
    1000000000
  );

  const stream = new PayPerSecondStream(
    rpcUrl,
    {
      ratePerSecond: 0.01,
      tokenDecimals: 6,
      tokenId: mint.toString(),
      recipient: wallet.publicKey.toString(),
      inactivityTimeoutMs: 30000,
      disableInactivityTimeout: true
    }
  );

  try {
    console.log("Starting stream...");
    const startResult = await stream.start(walletAdapter, 120);
    if (!startResult.success) {
      console.error("Failed to start stream:", startResult.error);
      return;
    }
    console.log(`Stream started with ID: ${startResult.streamId}`);

    const initialStatus = await stream.getStreamStatus();
    console.log("Initial status:", {
      isRunning: initialStatus.isRunning,
      activeTimeSeconds: initialStatus.activeTimeSeconds,
      depositedAmount: initialStatus.streamInfo?.depositedAmount.toString(),
      withdrawnAmount: initialStatus.streamInfo?.withdrawnAmount.toString(),
      totalCost: initialStatus.totalCost
    });

    console.log("Simulating active usage for 40 seconds...");
    await new Promise(resolve => setTimeout(resolve, 40000));

    const updatedStatus = await stream.getStreamStatus();
    console.log("Updated status after 40 seconds:", {
      isRunning: updatedStatus.isRunning,
      activeTimeSeconds: updatedStatus.activeTimeSeconds,
      depositedAmount: updatedStatus.streamInfo?.depositedAmount.toString(),
      withdrawnAmount: updatedStatus.streamInfo?.withdrawnAmount.toString(),
      totalCost: updatedStatus.totalCost
    });

    console.log("Waiting 5 seconds to ensure stream has started...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if automatic withdrawal worked; if not, perform manual withdrawal
    const statusBeforeWithdrawal = await stream.getStreamStatus();
    if (statusBeforeWithdrawal.streamInfo?.withdrawnAmount.toString() === '0' && startResult.streamId) {
      console.log("Automatic withdrawal did not trigger. Performing manual withdrawal...");

      // Get the current Solana block time to align with Streamflow's clock
      const latestSlot = await connection.getSlot("confirmed");
      let currentTime: number;
      const blockTime = await connection.getBlockTime(latestSlot);
      if (blockTime !== null && blockTime >= Number(statusBeforeWithdrawal.streamInfo?.start)) {
        currentTime = blockTime;
      } else {
        console.log("Block time is invalid or too early, falling back to Date.now()");
        currentTime = Math.floor(Date.now() / 1000);
      }

      const streamStartTime = Number(statusBeforeWithdrawal.streamInfo?.start);
      const elapsedTime = Math.max(0, currentTime - streamStartTime);
      const ratePerSecond = new BN(10000); // 0.01 tokens/second = 10,000 units/second
      let amountToWithdraw = new BN(elapsedTime).mul(ratePerSecond);

      // Ensure we don't withdraw more than the deposited amount
      const depositedAmount = new BN(statusBeforeWithdrawal.streamInfo?.depositedAmount);
      if (amountToWithdraw.gt(depositedAmount)) {
        amountToWithdraw = depositedAmount;
      }

      console.log(`Stream start time (Unix timestamp): ${streamStartTime}`);
      console.log(`Current block time (Unix timestamp): ${currentTime}`);
      console.log(`Elapsed time since stream start: ${elapsedTime} seconds`);
      console.log(`Calculated available amount: ${amountToWithdraw.toString()} units`);

      // Skip withdrawal if amount is 0
      if (amountToWithdraw.eq(new BN(0))) {
        console.log("Amount to withdraw is 0, skipping withdrawal...");
      } else {
        console.log(`Withdrawing ${amountToWithdraw.toString()} units for ${elapsedTime} seconds of usage...`);

        let withdrawResult = await stream.withdrawFromStream(
          startResult.streamId,
          walletAdapter,
          amountToWithdraw
        );

        // Fallback: If withdrawal fails due to Custom(115), parse the available amount from the error and retry
        if (!withdrawResult.success && withdrawResult.error?.transactionLogs) {
          const logs = withdrawResult.error.transactionLogs;
          const availableMatch = logs.find((log: string) => log.includes("Available for recipient:"));
          if (availableMatch) {
            const availableAmountStr = availableMatch.match(/Available for recipient: (\d+)/)?.[1];
            if (availableAmountStr) {
              const availableAmount = new BN(availableAmountStr);
              console.log(`Withdrawal failed: Requested amount exceeds available. Retrying with available amount: ${availableAmount.toString()} units...`);
              amountToWithdraw = availableAmount;
              withdrawResult = await stream.withdrawFromStream(
                startResult.streamId,
                walletAdapter,
                amountToWithdraw
              );
            }
          }
        }

        if (withdrawResult.success) {
          console.log(`Manual withdrawal successful. Transaction ID: ${withdrawResult.txId}`);
        } else {
          console.error("Manual withdrawal failed:", withdrawResult.error);
        }
      }

      // Check status after manual withdrawal
      const statusAfterWithdrawal = await stream.getStreamStatus();
      console.log("Status after manual withdrawal:", {
        isRunning: statusAfterWithdrawal.isRunning,
        activeTimeSeconds: statusAfterWithdrawal.activeTimeSeconds,
        depositedAmount: statusAfterWithdrawal.streamInfo?.depositedAmount.toString(),
        withdrawnAmount: statusAfterWithdrawal.streamInfo?.withdrawnAmount.toString(),
        totalCost: statusAfterWithdrawal.totalCost
      });

      // Check recipient's token balance to confirm withdrawal
      const recipientBalance = await withRetry(() => connection.getTokenAccountBalance(senderATA.address));
      console.log("Recipient token balance after withdrawal:", recipientBalance.value.uiAmount, "tokens");
    } else {
      console.log("Automatic withdrawal triggered successfully.");
    }

    console.log("Simulating inactivity...");
    await new Promise(resolve => setTimeout(resolve, 35000));

    const inactiveStatus = await stream.getStreamStatus();
    console.log("Status after inactivity:", {
      isRunning: inactiveStatus.isRunning,
      activeTimeSeconds: inactiveStatus.activeTimeSeconds,
      depositedAmount: inactiveStatus.streamInfo?.depositedAmount.toString(),
      withdrawnAmount: inactiveStatus.streamInfo?.withdrawnAmount.toString(),
      totalCost: inactiveStatus.totalCost
    });

    console.log("Resuming stream...");
    const resumeResult = await withRetry(() => stream.resume(walletAdapter, 60));
    if (!resumeResult.success) {
      console.error("Failed to resume stream:", resumeResult.error);
      return;
    }
    console.log("Stream resumed successfully");
    const resumedStatus = await stream.getStreamStatus();
    console.log("Status after resume:", {
      isRunning: resumedStatus.isRunning,
      activeTimeSeconds: resumedStatus.activeTimeSeconds,
      depositedAmount: resumedStatus.streamInfo?.depositedAmount.toString(),
      withdrawnAmount: resumedStatus.streamInfo?.withdrawnAmount.toString(),
      totalCost: resumedStatus.totalCost
    });

    console.log("Stopping stream...");
    const stopResult = await withRetry(() => stream.stop(walletAdapter));
    if (stopResult.success) {
      console.log("Stream stopped successfully");
    } else {
      console.error("Failed to stop stream:", stopResult.error);
    }
  } catch (error) {
    console.error("An error occurred during testing:", error);
  }
}

testWithKeypair()
  .catch(error => {
    console.error("Fatal error in test execution:", error);
    process.exit(1);
  });