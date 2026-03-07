#!/usr/bin/env node

/**
 * Morning launch gate
 * - strict readiness snapshot
 * - full demo verification
 *
 * Usage:
 *   pnpm morning
 */

import { spawn } from "node:child_process";

function run(cmd, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, {
      stdio: "inherit",
      shell: process.platform === "win32",
      ...opts,
    });
    p.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} failed with code ${code}`));
    });
  });
}

async function main() {
  console.log("\n🌅 Morning gate: strict demo status");
  await run("pnpm", ["demo-status"], {
    env: { ...process.env, VERISNAP_DEMO_STRICT: "1" },
  });

  console.log("\n🧪 Morning gate: full verify-demo");
  await run("pnpm", ["verify-demo"]);

  console.log("\n✅ Morning gate passed. Ready to run pnpm dev and demo.");
}

main().catch((err) => {
  console.error("\n❌ Morning gate failed:", err.message);
  process.exit(1);
});
