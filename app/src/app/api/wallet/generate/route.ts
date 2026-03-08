import { NextRequest, NextResponse } from "next/server";
import { createTestWallet } from "@/lib/xrpl";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`wallet:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded — try again shortly" },
        { status: 429 }
      );
    }

    const { address, seed } = await createTestWallet();
    return NextResponse.json({ success: true, address, seed });
  } catch (error) {
    console.error("[Wallet] Generate error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
