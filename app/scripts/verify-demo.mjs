#!/usr/bin/env node

/**
 * Demo verification checklist (non-interactive)
 * - env preflight
 * - production build
 * - API smoke
 * - privacy checks
 *
 * Usage:
 *   pnpm verify-demo
 *
 * Note: requires dev server running for smoke/privacy checks.
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
  console.log("\n✅ Step 1/4: Env preflight");
  await run("node", ["scripts/preflight.mjs"]);

  console.log("\n✅ Step 2/4: Production build");
  await run("pnpm", ["build"]);

  console.log("\n✅ Step 3/4: API smoke checks");
  await run("node", ["scripts/smoke.mjs"]);

  console.log("\n✅ Step 4/4: Privacy checks");
  await run("node", ["scripts/privacy-check.mjs"]);

  console.log("\n🎉 Demo verification passed. Ready for walkthrough.");
}

main().catch((err) => {
  console.error("\n❌ Demo verification failed:", err.message);
  process.exit(1);
});
