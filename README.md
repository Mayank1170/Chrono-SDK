# Chrono: Per-Second Payment Streaming on Solana

Chrono enables per-second token streaming on Solana using [Streamflow](https://streamflow.finance/). It provides a `PayPerSecondStream` class to integrate real-time payment features into your dApps, ideal for subscriptions, payroll, or usage-based billing.

## Features
- Stream tokens at a rate (e.g., 0.01 tokens/second).
- Start, pause, resume, and stop streams.
- Manual withdrawals with a fallback for timing issues.
- Test on Solana Devnet.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/chrono-finance/chrono.git
   cd chrono
   
2. **Install Dependencies**:
    ```bash
    npm install
    
3. **Set Up Environment**:
    ```
    WALLET_PRIVATE_KEY=[YOUR_PRIVATE_KEY_ARRAY]
RPC_ENDPOINT=https://api.devnet.solana.com


## Run the Demo

   ```bash
   npx tsx examples/create-stream-demo.ts
```

## License

 MIT License
 
## Resources

   - [Streamflow Docs](https://docs.streamflow.finance/)
   - [Solana Docs](https://docs.solana.com/)