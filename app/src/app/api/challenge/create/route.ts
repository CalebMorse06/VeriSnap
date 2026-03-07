import { NextRequest, NextResponse } from "next/server";
import { createEscrow, Wallet } from "@/lib/xrpl";

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

    const seed = process.env.XRPL_APP_WALLET_SEED;
    const address = process.env.XRPL_APP_WALLET_ADDRESS;

    if (!seed || !address) {
      return NextResponse.json(
        { success: false, error: "Missing XRPL_APP_WALLET_SEED or XRPL_APP_WALLET_ADDRESS" },
        { status: 500 }
      );
    }

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
