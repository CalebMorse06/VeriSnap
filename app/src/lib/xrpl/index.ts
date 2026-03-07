/**
 * XRPL Integration for VeriSnap
 *
 * XRPL is the enforcement layer — not just a payment rail.
 * - EscrowCreate: locks XRP before challenge begins (challenger cannot back out)
 * - EscrowFinish: releases payout instantly on verified pass ("snap-to-pay")
 * - CancelAfter: time-bounds resolution; expired escrows can be refunded
 */
import { Client, Wallet, xrpToDrops, dropsToXrp } from "xrpl";

const XRPL_SERVER = process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233";

let client: Client | null = null;

export async function getClient(): Promise<Client> {
  if (!client || !client.isConnected()) {
    client = new Client(XRPL_SERVER);
    await client.connect();
  }
  return client;
}

export interface EscrowResult {
  txHash: string;
  sequence: number;
  escrowCondition?: string;
}

/**
 * Lock stake into XRPL escrow when challenge is created.
 * Uses CancelAfter so funds auto-refundable if challenge expires.
 */
export async function createEscrow(
  creatorWallet: Wallet,
  destinationAddress: string, // app wallet or participant on pass
  amountXRP: number,
  expiresInHours: number = 24,
  challengeId?: string
): Promise<EscrowResult> {
  const xrplClient = await getClient();
  const cancelAfterUnix = Math.floor(Date.now() / 1000) + expiresInHours * 3600;
  // XRPL epoch starts Jan 1 2000 — subtract offset
  const RIPPLE_EPOCH_OFFSET = 946684800;
  const cancelAfter = cancelAfterUnix - RIPPLE_EPOCH_OFFSET;

  const escrow = {
    TransactionType: "EscrowCreate" as const,
    Account: creatorWallet.address,
    Destination: destinationAddress,
    Amount: xrpToDrops(amountXRP),
    CancelAfter: cancelAfter,
    Memos: challengeId ? [{
      Memo: {
        MemoType: Buffer.from("verisnap/challenge", "utf8").toString("hex").toUpperCase(),
        MemoData: Buffer.from(challengeId, "utf8").toString("hex").toUpperCase(),
      },
    }] : undefined,
  };

  const prepared = await xrplClient.autofill(escrow);
  const signed = creatorWallet.sign(prepared);
  const result = await xrplClient.submitAndWait(signed.tx_blob);

  return {
    txHash: result.result.hash,
    sequence: (prepared as any).Sequence ?? 0,
  };
}

/**
 * Finish escrow — release payout to winner after Gemini verifies pass.
 * App wallet signs this after receiving verification result.
 */
export async function finishEscrow(
  appWallet: Wallet,
  escrowOwner: string,
  escrowSequence: number,
  challengeId?: string
): Promise<string> {
  const xrplClient = await getClient();

  const finish = {
    TransactionType: "EscrowFinish" as const,
    Account: appWallet.address,
    Owner: escrowOwner,
    OfferSequence: escrowSequence,
    Memos: challengeId ? [{
      Memo: {
        MemoType: Buffer.from("verisnap/settle", "utf8").toString("hex").toUpperCase(),
        MemoData: Buffer.from(challengeId, "utf8").toString("hex").toUpperCase(),
      },
    }] : undefined,
  };

  const prepared = await xrplClient.autofill(finish);
  const signed = appWallet.sign(prepared);
  const result = await xrplClient.submitAndWait(signed.tx_blob);

  return result.result.hash;
}

/**
 * Cancel expired escrow — returns funds to creator.
 */
export async function cancelEscrow(
  wallet: Wallet,
  escrowOwner: string,
  escrowSequence: number
): Promise<string> {
  const xrplClient = await getClient();

  const cancel = {
    TransactionType: "EscrowCancel" as const,
    Account: wallet.address,
    Owner: escrowOwner,
    OfferSequence: escrowSequence,
  };

  const prepared = await xrplClient.autofill(cancel);
  const signed = wallet.sign(prepared);
  const result = await xrplClient.submitAndWait(signed.tx_blob);
  return result.result.hash;
}

export async function getBalance(address: string): Promise<string> {
  const xrplClient = await getClient();
  const response = await xrplClient.request({
    command: "account_info",
    account: address,
  });
  return String(dropsToXrp(response.result.account_data.Balance));
}

export async function createTestWallet(): Promise<{ address: string; seed: string }> {
  const xrplClient = await getClient();
  const { wallet } = await xrplClient.fundWallet();
  return { address: wallet.address, seed: wallet.seed! };
}

export { Wallet, xrpToDrops, dropsToXrp };
