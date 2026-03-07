import { NextRequest, NextResponse } from "next/server";
import { createEscrow, Wallet } from "@/lib/xrpl";
import { requireEnv } from "@/lib/env";
import { createChallengeSchema } from "@/lib/schemas";

interface CreateChallengeRequest {
  title: string;
  description: string;
  objective: string;
  location: { name: string; lat: number; lng: number };
  stakeAmountXrp: number;
  durationMinutes: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateChallengeRequest = await request.json();
    const parsed = createChallengeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid challenge payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const seed = requireEnv("XRPL_APP_WALLET_SEED");
    const address = requireEnv("XRPL_APP_WALLET_ADDRESS");

    const wallet = Wallet.fromSeed(seed);
    if (wallet.address !== address) {
      return NextResponse.json(
        { success: false, error: "XRPL wallet seed/address mismatch" },
        { status: 500 }
      );
    }

    // For hackathon MVP: escrow locks from app wallet to app wallet.
    // This still creates a real EscrowCreate tx on testnet and allows real EscrowFinish later.
    const escrow = await createEscrow(
      wallet,
      wallet.address,
      body.stakeAmountXrp,
      Math.max(1, Math.ceil(body.durationMinutes / 60)),
      `${body.title}-${Date.now()}`
    );

    return NextResponse.json({
      success: true,
      escrowTxHash: escrow.txHash,
      escrowSequence: escrow.sequence,
      escrowOwner: wallet.address,
    });
  } catch (error) {
    console.error("[CreateChallenge] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
