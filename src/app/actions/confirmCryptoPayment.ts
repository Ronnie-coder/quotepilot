"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requiredUsdt, usdtPaidTo, type ReceiptLog } from "@/utils/usdt";

// Marks an invoice paid only after the USDT transfer is confirmed on Polygon.
// Anyone with the invoice link can call this, so nothing the browser says is trusted:
// the transaction is read from the chain and must be a successful USDT transfer of at
// least the invoice total to the freelancer's wallet, not already used for another invoice.

const TX_HASH = /^0x[0-9a-f]{64}$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Receipt = {
  status: string;
  logs: ReceiptLog[];
} | null;

async function getReceipt(txHash: string): Promise<Receipt> {
  const rpc = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com";
  const res = await fetch(rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionReceipt", params: [txHash] }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Polygon RPC returned ${res.status}`);
  const body = await res.json();
  return body.result ?? null;
}

export type CryptoPaymentResult =
  | { status: "paid" }
  | { status: "pending" }
  | { status: "rejected"; message: string };

export async function confirmCryptoPaymentAction(invoiceId: string, txHash: string): Promise<CryptoPaymentResult> {
  if (!UUID.test(invoiceId) || !TX_HASH.test(txHash)) {
    return { status: "rejected", message: "Invalid payment reference." };
  }

  const supabase = createSupabaseAdminClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, user_id, total, currency, status, document_type, profiles ( wallet_address )")
    .eq("id", invoiceId)
    .single();

  if (!quote) return { status: "rejected", message: "Invoice not found." };
  if (String(quote.status).toLowerCase() === "paid") return { status: "paid" };
  if (String(quote.document_type).toLowerCase() !== "invoice" || quote.currency !== "USD") {
    return { status: "rejected", message: "This invoice can't be paid in USDT." };
  }

  const profile = (Array.isArray(quote.profiles) ? quote.profiles[0] : quote.profiles) as { wallet_address?: string | null } | null;
  const wallet = profile?.wallet_address?.toLowerCase();
  if (!wallet || !/^0x[0-9a-f]{40}$/.test(wallet)) {
    return { status: "rejected", message: "The business has no valid wallet address." };
  }

  // One transaction pays one invoice.
  const { count: reused } = await supabase
    .from("quotes")
    .select("id", { count: "exact", head: true })
    .eq("payment_tx_hash", txHash)
    .neq("id", invoiceId);
  if (reused) return { status: "rejected", message: "This transaction was already used for another invoice." };

  let receipt: Receipt;
  try {
    receipt = await getReceipt(txHash);
  } catch (err) {
    console.error("Polygon RPC error:", err);
    return { status: "pending" }; // try again shortly
  }
  if (!receipt) return { status: "pending" }; // not mined yet
  if (receipt.status !== "0x1") return { status: "rejected", message: "The transaction failed on the network." };

  const required = requiredUsdt(Number(quote.total));
  const paid = usdtPaidTo(receipt.logs, wallet);

  if (paid < required) {
    return { status: "rejected", message: "No USDT transfer of the full amount to the business's wallet was found." };
  }

  const { error } = await supabase
    .from("quotes")
    .update({ status: "Paid", payment_tx_hash: txHash, payment_method: "USDT" })
    .eq("id", invoiceId);
  if (error) {
    console.error("Failed to mark invoice paid:", error);
    return { status: "pending" };
  }

  revalidatePath(`/p/${invoiceId}`);
  revalidatePath("/dashboard/invoices");
  return { status: "paid" };
}
