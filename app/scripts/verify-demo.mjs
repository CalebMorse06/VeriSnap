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

const APP_ORIGIN = process.env.VERISNAP_APP_ORIGIN || "http://localhost:3000";

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

async function waitForHealth(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`, { cache: "no-store" });
      if (res.ok) return;
    } catch {}
    await wait(800);
  }
  throw new Error(`Timed out waiting for ${url}/api/health`);
}

async function stopProcess(child) {
  if (!child?.pid) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => child.once("exit", resolve)),
    wait(3000),
  ]);
  if (!child.killed) {
    try { child.kill("SIGKILL"); } catch {}
  }
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
    });
    await waitForHealth(APP_ORIGIN, 30000);

    console.log("\n✅ Step 4/4: API smoke + privacy checks");
    await run("node", ["scripts/smoke.mjs"]);
    await run("node", ["scripts/privacy-check.mjs"]);

    console.log("\n🎉 Demo verification passed. Ready for walkthrough.");
  } finally {
    await stopProcess(dev);
  }
}

main().catch((err) => {
  console.error("\n❌ Demo verification failed:", err.message);
  process.exit(1);
});
