import { SignerWalletAdapter, WalletReadyState, WalletName, SupportedTransactionVersions, WalletAdapterEvents } from "@solana/wallet-adapter-base";
import { Keypair, Transaction, Connection, SendOptions, VersionedTransaction, PublicKey } from "@solana/web3.js";
import { ArgumentMap } from "eventemitter3";

export class KeypairAdapter implements SignerWalletAdapter {
    name = "Keypair" as WalletName<"Keypair">;
    url = "";
    icon = "";
    readyState = WalletReadyState.Installed;
    connecting = false;
    connected = true;
    publicKey = this.keypair.publicKey;

    supportedTransactionVersions: SupportedTransactionVersions = new Set(['legacy', 0]);

    public getPublicKey(): PublicKey {
        return this.keypair.publicKey;
    }
    constructor(private keypair: Keypair) { }
    eventNames(): (keyof WalletAdapterEvents)[] {
        throw new Error("Method not implemented.");
    }
    listeners<T extends keyof WalletAdapterEvents>(event: T): ((...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]) => void)[] {
        throw new Error("Method not implemented.");
    }
    listenerCount(event: keyof WalletAdapterEvents): number {
        throw new Error("Method not implemented.");
    }
    emit<T extends keyof WalletAdapterEvents>(event: T, ...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]): boolean {
        throw new Error("Method not implemented.");
    }
    on<T extends keyof WalletAdapterEvents>(event: T, fn: (...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]) => void, context?: any): this {
        throw new Error("Method not implemented.");
    }
    addListener<T extends keyof WalletAdapterEvents>(event: T, fn: (...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]) => void, context?: any): this {
        throw new Error("Method not implemented.");
    }
    once<T extends keyof WalletAdapterEvents>(event: T, fn: (...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]) => void, context?: any): this {
        throw new Error("Method not implemented.");
    }
    removeListener<T extends keyof WalletAdapterEvents>(event: T, fn?: ((...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]) => void) | undefined, context?: any, once?: boolean): this {
        throw new Error("Method not implemented.");
    }
    off<T extends keyof WalletAdapterEvents>(event: T, fn?: ((...args: ArgumentMap<WalletAdapterEvents>[Extract<T, keyof WalletAdapterEvents>]) => void) | undefined, context?: any, once?: boolean): this {
        throw new Error("Method not implemented.");
    }
    removeAllListeners(event?: keyof WalletAdapterEvents | undefined): this {
        throw new Error("Method not implemented.");
    }

    async signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T> {
        // Check if it's a plain object that needs to be converted to Transaction
        if ('sign' in transaction) {
            (transaction as VersionedTransaction).sign([this.keypair]);
        } else {
            (transaction as Transaction).partialSign(this.keypair);
        }
        return transaction;
    }

        // Handle VersionedTransaction and regular Transaction
        // if (transaction instanceof VersionedTransaction) {
        //     transaction.sign([this.keypair]);
        // } else if (transaction instanceof Transaction) {
        //     transaction.partialSign(this.keypair);
        // }
        // return transaction;

    async signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]> {
        return Promise.all(transactions.map(tx => this.signTransaction(tx)));
    }

    async sendTransaction(
        transaction: Transaction | VersionedTransaction,
        connection: Connection,
        options?: SendOptions
    ): Promise<string> {
        const signedTx = await this.signTransaction(transaction);
        const rawTransaction = 'serialize' in signedTx ? signedTx.serialize() : Transaction.from(signedTx as any).serialize();
        return connection.sendRawTransaction(rawTransaction, options);
    }

    connect = async () => { };
    disconnect = async () => { };
} 