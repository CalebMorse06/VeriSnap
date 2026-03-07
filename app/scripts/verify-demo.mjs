#!/usr/bin/env node

/**
 * Demo verification checklist (non-interactive)
 * - env preflight
 * - production build
 * - starts dev server automatically
 * - API smoke
 * - privacy checks
 *
 * Usage:
 *   pnpm verify-demo
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

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  let dev = null;
  try {
    console.log("\n✅ Step 1/4: Env preflight");
    await run("node", ["scripts/preflight.mjs"]);

    console.log("\n✅ Step 2/4: Production build");
    await run("pnpm", ["build"]);

    console.log("\n✅ Step 3/4: Start dev server");
    dev = spawn("pnpm", ["dev"], {
      stdio: "ignore",
      shell: process.platform === "win32",
      detached: true,
    });
    dev.unref();
    await wait(4000);

    console.log("\n✅ Step 4/4: API smoke + privacy checks");
    await run("node", ["scripts/smoke.mjs"]);
    await run("node", ["scripts/privacy-check.mjs"]);

    console.log("\n🎉 Demo verification passed. Ready for walkthrough.");
  } finally {
    // best-effort cleanup
    if (dev?.pid) {
      try {
        process.kill(dev.pid, "SIGTERM");
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error("\n❌ Demo verification failed:", err.message);
  process.exit(1);
});
