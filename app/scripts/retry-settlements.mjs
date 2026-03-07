#!/usr/bin/env node

/**
 * Retry pending XRPL settlements
 *
 * Finds verified-passed challenges that do not yet have settlement_tx
 * and attempts EscrowFinish again.
 *
 * Usage:
 *   pnpm retry-settlements
 */

import { createClient } from "@supabase/supabase-js";
import { Client, Wallet } from "xrpl";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XRPL_SERVER = process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233";
const XRPL_APP_WALLET_SEED = process.env.XRPL_APP_WALLET_SEED;

function requireEnv(name, value) {
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

async function main() {
  requireEnv("SUPABASE_URL", SUPABASE_URL);
  requireEnv("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY);
  requireEnv("XRPL_APP_WALLET_SEED", XRPL_APP_WALLET_SEED);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const xrpl = new Client(XRPL_SERVER);
  await xrpl.connect();
  const appWallet = Wallet.fromSeed(XRPL_APP_WALLET_SEED);

  try {
    const { data: pending, error } = await supabase
      .from("challenges")
      .select("id, escrow_owner, escrow_sequence")
      .eq("status", "PASSED")
      .eq("verification_passed", true)
      .is("settlement_tx", null)
      .not("escrow_owner", "is", null)
      .not("escrow_sequence", "is", null)
      .limit(50);

    if (error) throw error;

    if (!pending || pending.length === 0) {
      console.log("No pending settlements found.");
      return;
    }

    console.log(`Found ${pending.length} pending settlement(s).`);

    let success = 0;
    let failed = 0;

    for (const c of pending) {
      try {
        const tx = {
          TransactionType: "EscrowFinish",
          Account: appWallet.address,
          Owner: c.escrow_owner,
          OfferSequence: c.escrow_sequence,
          Memos: [{
            Memo: {
              MemoType: Buffer.from("verisnap/retry", "utf8").toString("hex").toUpperCase(),
              MemoData: Buffer.from(c.id, "utf8").toString("hex").toUpperCase(),
            },
          }],
        };

        const prepared = await xrpl.autofill(tx);
        const signed = appWallet.sign(prepared);
        const result = await xrpl.submitAndWait(signed.tx_blob);
        const hash = result.result.hash;

        const { error: updateErr } = await supabase
          .from("challenges")
          .update({
            settlement_tx: hash,
            status: "SETTLED",
            resolved_at: new Date().toISOString(),
          })
          .eq("id", c.id);

        if (updateErr) throw updateErr;

        success++;
        console.log(`✓ Settled ${c.id} -> ${hash}`);
      } catch (e) {
        failed++;
        console.error(`✗ Failed settlement for ${c.id}: ${String(e)}`);
      }
    }

    console.log(`\nDone. Success: ${success}, Failed: ${failed}`);
  } finally {
    await xrpl.disconnect();
  }
}

main().catch((err) => {
  console.error("retry-settlements failed:", err.message);
  process.exit(1);
});
