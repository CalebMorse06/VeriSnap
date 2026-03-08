import { NextResponse } from "next/server";
import { checkServiceHealth } from "@/lib/service-health";

export async function GET() {
  const health = await checkServiceHealth();
  const allOk = health.xrpl.ok && health.pinata.ok && health.gemini.ok && health.supabase.ok;

  return NextResponse.json({
    ok: allOk,
    service: "verisnap",
    services: health,
    appWallet: process.env.XRPL_APP_WALLET_ADDRESS || null,
    timestamp: new Date().toISOString(),
  });
}
