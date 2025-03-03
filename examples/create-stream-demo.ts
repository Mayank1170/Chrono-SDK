import { StreamService } from "../src/stream/streamService";

async function createStreamDemo() {
  const rpcUrl = "https://api.mainnet-beta.solana.com";
  const streamService = new StreamService(rpcUrl);

  const senderWallet = { /* Your wallet details */ };
  const recipientAddress = "recipient_wallet_address";
  const tokenId = "token_mint_address";
  const totalAmount = 100; // Total amount of tokens
  const ratePerSecond = 0.01; // Amount deducted per second

  try {
    const stream = await streamService.createStream(
      senderWallet,
      recipientAddress,
      tokenId,
      totalAmount,
      ratePerSecond
    );
    console.log("Stream created:", stream);
  } catch (error) {
    console.error("Error in createStreamDemo:", error);
  }
}

createStreamDemo();
