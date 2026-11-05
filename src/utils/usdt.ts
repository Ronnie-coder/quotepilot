// USDT (Polygon) transfer helpers, kept separate so they can be tested on their own.
export const USDT_POLYGON = "0xc2132d05d31c914a87c6611c10748aeb04b58e8f";
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export type ReceiptLog = { address: string; topics: string[]; data: string };

/** Total USDT (6 decimals, as an integer) that a transaction's logs moved to `wallet`. */
export function usdtPaidTo(logs: ReceiptLog[], wallet: string): bigint {
  const paddedWallet = `0x${wallet.toLowerCase().replace(/^0x/, "").padStart(64, "0")}`;
  return logs
    .filter(
      (log) =>
        log.address.toLowerCase() === USDT_POLYGON &&
        log.topics[0]?.toLowerCase() === TRANSFER_TOPIC &&
        log.topics[2]?.toLowerCase() === paddedWallet
    )
    .reduce((sum, log) => sum + BigInt(log.data), BigInt(0));
}

/** The smallest amount (6 decimals) that counts as paying `total`; 1 cent below for rounding. */
export function requiredUsdt(total: number): bigint {
  return BigInt(Math.max(0, Math.round(total * 1e6) - 10_000));
}
