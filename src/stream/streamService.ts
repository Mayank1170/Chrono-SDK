import { StreamflowSolana, getBN } from "@streamflow/stream";

export class StreamService {
  private client: StreamflowSolana.SolanaStreamClient;

  constructor(rpcUrl: string) {
    this.client = new StreamflowSolana.SolanaStreamClient(rpcUrl);
  }

  async createStream(
    senderWallet: any,
    recipientAddress: string,
    tokenId: string,
    amount: number,
    ratePerSecond: number
  ) {
    const createParams = {
      recipient: recipientAddress,
      tokenId: tokenId,
      start: Math.floor(Date.now() / 1000),
      amount: getBN(amount, 9),
      period: 1, 
      amountPerPeriod: getBN(ratePerSecond, 9),
      name: "Pay-per-second stream",
      cliff: 0,
      cliffAmount: getBN(0, 9),
      canTopup: true,
      cancelableBySender: true,
      cancelableByRecipient: false,
      transferableBySender: false,
      transferableByRecipient: false,
      automaticWithdrawal: true,
      withdrawalFrequency: 60,
    };

    try {
      const result = await this.client.create(createParams, senderWallet);
      console.log("Stream created successfully:", result);
      return result;
    } catch (error) {
      console.error("Error creating stream:", error);
      throw error;
    }
  }
}
