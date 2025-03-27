import BN from "bn.js";
import {
  StreamflowSolana,
  getBN,
  getNumberFromBN,
  ICreateStreamData,
} from "@streamflow/stream";
import { SignerWalletAdapter } from "@solana/wallet-adapter-base";
import { Connection } from "@solana/web3.js";

export class StreamState {
  private startTime: number | null = null;
  private totalActiveTime: number = 0;

  public start(): void {
    if (this.startTime === null) {
      this.startTime = Date.now();
    }
  }

  public pause(): void {
    if (this.startTime !== null) {
      this.totalActiveTime += Date.now() - this.startTime;
      this.startTime = null;
    }
  }

  public resume(): void {
    if (this.startTime === null) {
      this.startTime = Date.now();
    }
  }

  public getTotalActiveTime(): number {
    if (this.startTime !== null) {
      return Math.floor((this.totalActiveTime + (Date.now() - this.startTime)) / 1000);
    }
    return Math.floor(this.totalActiveTime / 1000);
  }

  public reset(): void {
    this.startTime = null;
    this.totalActiveTime = 0;
  }
}

export class PayPerSecondStream {
  private client: StreamflowSolana.SolanaStreamClient;
  private streamState: StreamState;
  private currentStreamId: string | null = null;
  private activityDetectionInterval: NodeJS.Timeout | null = null;
  private inactivityTimeout: number = 60000;
  private lastActivityTime: number = Date.now();
  private ratePerSecond: BN;
  private tokenDecimals: number;
  private tokenId: string;
  private recipient: string;
  private isStreamRunning: boolean = false;
  private connection: Connection;
  private disableInactivityTimeout: boolean; // Add flag to disable inactivity timeout

  constructor(
    rpcUrl: string,
    options: {
      inactivityTimeoutMs?: number;
      ratePerSecond: number;
      tokenDecimals: number;
      tokenId: string;
      recipient: string;
      disableInactivityTimeout?: boolean; // Add option to disable inactivity timeout
    }
  ) {
    this.connection = new Connection(rpcUrl, {
      commitment: "confirmed",
      disableRetryOnRateLimit: false,
    });
    this.client = new StreamflowSolana.SolanaStreamClient(rpcUrl, undefined, {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000,
    });
    this.streamState = new StreamState();
    this.inactivityTimeout = options.inactivityTimeoutMs || 60000;
    this.ratePerSecond = getBN(options.ratePerSecond, options.tokenDecimals);
    this.tokenDecimals = options.tokenDecimals;
    this.tokenId = options.tokenId;
    this.recipient = options.recipient;
    this.disableInactivityTimeout = options.disableInactivityTimeout || false; // Default to false
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 5,
    rateLimitRetryMs: number = 1000
  ): Promise<T> {
    let lastError;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (error instanceof Error) {
          if (error.message.includes("expired")) {
            const backoffTime = 250 * Math.pow(2, attempt); // 250ms, 500ms, 1s, 2s, 4s
            console.log(`Transaction expired. Retrying in ${backoffTime / 1000}s... (${maxRetries - attempt - 1} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            continue;
          }
          if (error.message.includes("429")) {
            console.log(`Rate limited (429). Retrying in ${rateLimitRetryMs / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, rateLimitRetryMs));
            continue;
          }
        }
        throw error;
      }
    }
    throw lastError;
  }

  public async start(
    wallet: SignerWalletAdapter,
    initialDurationSeconds: number = 300
  ): Promise<{ success: boolean; streamId?: string; error?: any }> {
    try {
      this.streamState.start();
      this.startActivityDetection();
      const initialAmount = this.ratePerSecond.mul(new BN(initialDurationSeconds));
      const result = await this.executeWithRetry(() =>
        this.createStream(wallet, initialAmount, initialDurationSeconds)
      );
      if (result.success && result.streamId) {
        this.currentStreamId = result.streamId;
        this.isStreamRunning = true;
        return { success: true, streamId: result.streamId };
      }
      this.streamState.pause();
      return { success: false, error: result.error };
    } catch (error) {
      this.streamState.pause();
      return { success: false, error };
    }
  }

  public pause(): void {
    this.streamState.pause();
    this.isStreamRunning = false;
  }

  public async resume(
    wallet: SignerWalletAdapter,
    additionalDurationSeconds: number = 60
  ): Promise<{ success: boolean; streamId?: string; error?: any }> {
    if (this.currentStreamId) {
      try {
        const amount = this.ratePerSecond.mul(new BN(additionalDurationSeconds));
        const topupResult = await this.topupStream(this.currentStreamId, wallet, amount);
        if (topupResult.success) {
          this.streamState.resume();
          this.isStreamRunning = true;
          return { success: true, streamId: this.currentStreamId };
        }
        return this.start(wallet, additionalDurationSeconds);
      } catch (error) {
        return { success: false, error };
      }
    }
    return this.start(wallet, additionalDurationSeconds);
  }

  public async stop(
    wallet: SignerWalletAdapter
  ): Promise<{ success: boolean; error?: any }> {
    try {
      this.stopActivityDetection();
      this.pause();
      if (this.currentStreamId) {
        const result = await this.client.cancel(
          { id: this.currentStreamId },
          { invoker: wallet }
        );
        this.currentStreamId = null;
        return { success: true };
      }
      return { success: true };
    } catch (error) {
      console.error("Error canceling stream:", error);
      return { success: false, error };
    }
  }

  public async getStreamStatus(): Promise<{
    isRunning: boolean;
    activeTimeSeconds: number;
    streamInfo?: any;
    totalCost?: number;
  }> {
    const activeTimeSeconds = this.streamState.getTotalActiveTime();
    if (this.currentStreamId) {
      try {
        const stream = await this.client.getOne({ id: this.currentStreamId });
        const withdrawnAmount = getNumberFromBN(stream.withdrawnAmount, this.tokenDecimals);
        return {
          isRunning: this.isStreamRunning,
          activeTimeSeconds,
          streamInfo: stream,
          totalCost: withdrawnAmount,
        };
      } catch (error) {
        return { isRunning: this.isStreamRunning, activeTimeSeconds };
      }
    }
    return { isRunning: this.isStreamRunning, activeTimeSeconds };
  }

  private handleInactivity = async (): Promise<void> => {
    if (this.disableInactivityTimeout) return; // Skip inactivity check if disabled
    const currentTime = Date.now();
    if (currentTime - this.lastActivityTime > this.inactivityTimeout && this.isStreamRunning) {
      this.pause();
    }
  };

  private startActivityDetection(): void {
    if (this.activityDetectionInterval) clearInterval(this.activityDetectionInterval);
    this.activityDetectionInterval = setInterval(this.handleInactivity, 10000);
    if (typeof window !== "undefined") {
      window.addEventListener("mousemove", this.updateActivity);
      window.addEventListener("keypress", this.updateActivity);
      window.addEventListener("scroll", this.updateActivity);
      window.addEventListener("click", this.updateActivity);
    }
  }

  private stopActivityDetection(): void {
    if (this.activityDetectionInterval) {
      clearInterval(this.activityDetectionInterval);
      this.activityDetectionInterval = null;
    }
    if (typeof window !== "undefined") {
      window.removeEventListener("mousemove", this.updateActivity);
      window.removeEventListener("keypress", this.updateActivity);
      window.removeEventListener("scroll", this.updateActivity);
      window.removeEventListener("click", this.updateActivity);
    }
  }

  private updateActivity = (): void => {
    this.lastActivityTime = Date.now();
    if (!this.isStreamRunning && this.currentStreamId) {
      this.streamState.resume();
      this.isStreamRunning = true;
    }
  };

  private async createStream(
    wallet: SignerWalletAdapter,
    amount: BN,
    durationSeconds: number,
    retryCount: number = 5
  ): Promise<{ success: boolean; streamId?: string; error?: any }> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const start = now + 5; // Reduced from 30 to 5 seconds
      const cliff = start + 5;

      const { value: { blockhash, lastValidBlockHeight } } = await this.connection.getLatestBlockhashAndContext("confirmed");

      const createStreamParams: ICreateStreamData = {
        recipient: this.recipient,
        tokenId: this.tokenId,
        start,
        amount: this.ratePerSecond.mul(new BN(durationSeconds)),
        period: 1,
        cliff,
        cliffAmount: new BN(0),
        amountPerPeriod: this.ratePerSecond,
        name: "Pay-per-second stream",
        canTopup: true,
        cancelableBySender: true,
        cancelableByRecipient: false,
        transferableBySender: false,
        transferableByRecipient: false,
        automaticWithdrawal: true,
        withdrawalFrequency: 10,
      };

      const result = await this.client.create(
        createStreamParams,
        { sender: wallet, isNative: false }
      );
      const { txId, metadataId } = result;

      const confirmed = await this.monitorTransaction(txId, lastValidBlockHeight);
      if (!confirmed) {
        throw new Error(`Transaction ${txId} failed to confirm within retry window`);
      }

      console.log(`Stream transaction confirmed: ${txId}`);
      return { success: true, streamId: metadataId };
    } catch (error) {
      console.error("Error creating stream:", error);
      if (error instanceof Error && (error.message.includes("expired") || error.message.includes("429")) && retryCount > 0) {
        const backoffTime = 250 * Math.pow(2, 5 - retryCount);
        console.log(`Transaction issue. Retrying in ${backoffTime / 1000}s... (${retryCount} attempts left)`);
        await new Promise(res => setTimeout(res, backoffTime));
        return this.createStream(wallet, amount, durationSeconds, retryCount - 1);
      }
      return { success: false, error };
    }
  }

  private async monitorTransaction(
    txId: string,
    lastValidBlockHeight: number,
    maxRetries: number = 15
  ): Promise<boolean> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const { value: status } = await this.connection.getSignatureStatus(txId);
        if (status && (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")) {
          return true;
        }
        const blockHeight = await this.connection.getBlockHeight();
        if (blockHeight > lastValidBlockHeight) {
          console.log(`Blockhash expired for ${txId}. Current height: ${blockHeight}, Last valid: ${lastValidBlockHeight}`);
          return false;
        }
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error monitoring transaction ${txId}:`, error);
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    console.log(`Transaction ${txId} failed to confirm after ${maxRetries} attempts`);
    return false;
  }

  public async withdrawFromStream(
    streamId: string,
    wallet: SignerWalletAdapter,
    amount?: BN
  ): Promise<{ success: boolean; txId?: string; error?: any }> {
    try {
      const { txId } = await this.client.withdraw(
        { id: streamId, amount },
        { invoker: wallet }
      );
      return { success: true, txId };
    } catch (error) {
      console.error("Error withdrawing from stream:", error);
      return { success: false, error };
    }
  }

  private async topupStream(
    streamId: string,
    wallet: SignerWalletAdapter,
    amount: BN
  ): Promise<{ success: boolean; txId?: string; error?: any }> {
    try {
      const { txId } = await this.client.topup(
        { id: streamId, amount },
        { invoker: wallet }
      );
      return { success: true, txId };
    } catch (error) {
      console.error("Error topping up stream:", error);
      return { success: false, error };
    }
  }
}