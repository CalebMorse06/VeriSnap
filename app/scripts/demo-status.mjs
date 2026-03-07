#!/usr/bin/env node

/**
 * Demo status snapshot
 * - checks local app health endpoint
 * - checks pending settlement backlog in Supabase
 *
 * Usage:
 *   pnpm demo-status
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const APP_ORIGIN = process.env.VERISNAP_APP_ORIGIN || "http://localhost:3000";
const STRICT_MODE = process.env.VERISNAP_DEMO_STRICT === "1";

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

async function checkHealth() {
  try {
    const res = await fetch(`${APP_ORIGIN}/api/health`, { cache: "no-store" });
    if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
    const json = await res.json();
    return {
      ok: Boolean(json?.ok),
      detail: json?.services ? `${json.services.configured}/${json.services.total} services configured` : "ok",
    };
  } catch {
    return { ok: false, detail: "app not reachable" };
  }
}

async function checkPendingSettlements() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { ok: false, detail: "missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY" };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { count, error } = await supabase
    .from("challenges")
    .select("id", { count: "exact", head: true })
    .eq("status", "PASSED")
    .eq("verification_passed", true)
    .is("settlement_tx", null);

  if (error) return { ok: false, detail: error.message };
  const pending = Number(count ?? 0);
  return { ok: true, detail: `${pending} pending`, pending };
}

async function main() {
  loadEnvLocal();

  const [health, settlement] = await Promise.all([
    checkHealth(),
    checkPendingSettlements(),
  ]);

  console.log("\nVeriSnap Demo Status");
  console.log("-------------------");
  console.log(`${health.ok ? "✅" : "❌"} App health: ${health.detail}`);
  console.log(`${settlement.ok ? "✅" : "⚠️"} Pending settlements: ${settlement.detail}`);

  if (STRICT_MODE) {
    const pending = Number(settlement?.pending ?? 0);
    if (pending > 0) {
      console.error(`\n❌ Strict mode: ${pending} pending settlement(s) detected.`);
      process.exit(1);
    }
  }

  if (!health.ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("demo-status failed:", err.message);
  process.exit(1);
});
