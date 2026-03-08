/**
 * Service health checks — real pings with latency tracking
 * 60-second in-memory cache to avoid hammering services
 */

import { Client } from "xrpl";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSupabaseAdmin } from "./supabase";

export interface ServiceHealthDetail {
  ok: boolean;
  latencyMs: number | null;
  error?: string;
}

export interface ServiceHealth {
  xrpl: ServiceHealthDetail;
  pinata: ServiceHealthDetail;
  gemini: ServiceHealthDetail;
  supabase: ServiceHealthDetail;
}

let cachedHealth: ServiceHealth | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

export async function checkServiceHealth(): Promise<ServiceHealth> {
  const now = Date.now();
  if (cachedHealth && now - cachedAt < CACHE_TTL_MS) {
    return cachedHealth;
  }

  const [xrpl, pinata, gemini, supabase] = await Promise.all([
    checkXrplHealth(),
    checkPinataHealth(),
    checkGeminiHealth(),
    checkSupabaseHealth(),
  ]);

  cachedHealth = { xrpl, pinata, gemini, supabase };
  cachedAt = now;
  return cachedHealth;
}

async function timed<T>(fn: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, latencyMs: Date.now() - start };
}

async function checkXrplHealth(): Promise<ServiceHealthDetail> {
  if (!process.env.XRPL_APP_WALLET_ADDRESS || !process.env.XRPL_APP_WALLET_SEED) {
    return { ok: false, latencyMs: null, error: "Not configured" };
  }
  try {
    const server = process.env.XRPL_SERVER || "wss://s.altnet.rippletest.net:51233";
    const client = new Client(server);
    const { latencyMs } = await timed(async () => {
      await client.connect();
      await client.request({ command: "server_info" });
      await client.disconnect();
    });
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, latencyMs: null, error: String(err) };
  }
}

async function checkPinataHealth(): Promise<ServiceHealthDetail> {
  if (!process.env.PINATA_JWT) {
    return { ok: false, latencyMs: null, error: "Not configured" };
  }
  try {
    const { result: response, latencyMs } = await timed(() =>
      fetch("https://api.pinata.cloud/data/testAuthentication", {
        headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
        signal: AbortSignal.timeout(5000),
      })
    );
    return { ok: response.ok, latencyMs, error: response.ok ? undefined : `HTTP ${response.status}` };
  } catch (err) {
    return { ok: false, latencyMs: null, error: String(err) };
  }
}

async function checkGeminiHealth(): Promise<ServiceHealthDetail> {
  if (!process.env.GEMINI_API_KEY) {
    return { ok: false, latencyMs: null, error: "Not configured" };
  }
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const { latencyMs } = await timed(async () => {
      await model.generateContent("Reply with: ok");
    });
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, latencyMs: null, error: String(err) };
  }
}

async function checkSupabaseHealth(): Promise<ServiceHealthDetail> {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return { ok: false, latencyMs: null, error: "Not configured" };
  }
  try {
    const { latencyMs } = await timed(async () => {
      const { error } = await sb.from("challenges").select("id").limit(1);
      if (error) throw error;
    });
    return { ok: true, latencyMs };
  } catch (err) {
    return { ok: false, latencyMs: null, error: String(err) };
  }
}

/**
 * Check if a specific operation's required services are available
 */
export function getRequiredServices(operation: "create" | "verify" | "read"): (keyof ServiceHealth)[] {
  switch (operation) {
    case "create":
      return ["xrpl", "supabase"];
    case "verify":
      return ["pinata", "gemini", "xrpl", "supabase"];
    case "read":
      return ["supabase"];
    default:
      return [];
  }
}
