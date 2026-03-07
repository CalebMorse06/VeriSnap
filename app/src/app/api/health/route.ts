import { NextResponse } from "next/server";
import { getRuntimeConfig } from "@/lib/env";

export async function GET() {
  const cfg = getRuntimeConfig();
  return NextResponse.json({
    ok: cfg.pinataConfigured && cfg.geminiConfigured && cfg.xrplConfigured,
    service: "verisnap",
    ...cfg,
    timestamp: new Date().toISOString(),
  });
}
