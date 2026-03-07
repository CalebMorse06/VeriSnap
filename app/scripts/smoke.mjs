#!/usr/bin/env node

/**
 * VeriSnap smoke test
 * Usage: node scripts/smoke.mjs [baseUrl]
 */

const baseUrl = process.argv[2] || "http://localhost:3000";

async function check(path, expect = (j) => j?.success !== false) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url);
  let json = null;
  try {
    json = await res.json();
  } catch {
    throw new Error(`${path}: non-JSON response (${res.status})`);
  }

  if (!res.ok) {
    throw new Error(`${path}: HTTP ${res.status} ${JSON.stringify(json)}`);
  }
  if (!expect(json)) {
    throw new Error(`${path}: unexpected payload ${JSON.stringify(json)}`);
  }
  return json;
}

async function main() {
  const results = [];

  const health = await check("/api/health", (j) => j?.ok === true);
  results.push(["/api/health", "ok", `services: ${["pinataConfigured","geminiConfigured","xrplConfigured","supabaseConfigured"].filter(k => health[k]).length}/4 configured`]);

  const challenges = await check("/api/challenges", (j) => Array.isArray(j?.challenges));
  results.push(["/api/challenges", "ok", `count=${challenges.challenges.length}`]);

  const feed = await check("/api/feed", (j) => Array.isArray(j?.feed));
  results.push(["/api/feed", "ok", `public_count=${feed.feed.length}`]);

  console.log("VeriSnap smoke test passed:\n");
  for (const [path, status, info] of results) {
    console.log(`- ${path}: ${status} (${info})`);
  }
}

main().catch((err) => {
  console.error("Smoke test failed:", err.message);
  process.exit(1);
});
