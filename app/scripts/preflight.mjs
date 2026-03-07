#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env.local");
const required = [
  "PINATA_JWT",
  "GEMINI_API_KEY",
  "XRPL_SERVER",
  "XRPL_APP_WALLET_ADDRESS",
  "XRPL_APP_WALLET_SEED",
];

if (!fs.existsSync(envPath)) {
  console.error("❌ .env.local not found. Copy from .env.example first.");
  process.exit(1);
}

const content = fs.readFileSync(envPath, "utf8");
const missing = required.filter((key) => {
  const line = content.split("\n").find((l) => l.startsWith(`${key}=`));
  if (!line) return true;
  const val = line.split("=").slice(1).join("=").trim();
  return !val || val.includes("your_");
});

if (missing.length) {
  console.error("❌ Missing/placeholder env vars:");
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

console.log("✅ Env preflight passed");
console.log("Next steps:");
console.log("  1) pnpm build");
console.log("  2) pnpm dev (or pnpm start after build)");
console.log("  3) open http://localhost:3000/api/health");
