import { NextRequest, NextResponse } from "next/server";
import { uploadProofPrivate, createVerifierAccessLink } from "@/lib/pinata";
import { verifyProof } from "@/lib/gemini";
import { finishEscrow, Wallet } from "@/lib/xrpl";

interface VerifyRequest {
  challengeId: string;
  imageData: string; // base64
  challengeObjective: string;
  participantAddress?: string;
  escrowOwner?: string;
  escrowSequence?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const { challengeId, imageData, challengeObjective, participantAddress, escrowOwner, escrowSequence } = body;

    // 1. Upload proof to Pinata
    console.log("[Verify] Uploading to Pinata...");
    const upload = await uploadProofPrivate(imageData, {
      challengeId,
      timestamp: new Date().toISOString(),
      participantAddress,
    });
    console.log("[Verify] Uploaded:", upload.cid);

    // 2. Create scoped verifier link + verify with Gemini
    const verifierLink = await createVerifierAccessLink(upload.cid);
    console.log("[Verify] Verifying with Gemini...");
    const verification = await verifyProof(imageData, challengeObjective, `Private proof link: ${verifierLink}`);
    console.log("[Verify] Result:", verification);

    // 3. Settle on XRPL (if passed and escrow details are provided)
    let settlementTx: string | null = null;
    if (verification.passed && escrowOwner && typeof escrowSequence === "number") {
      console.log("[Verify] Settling on XRPL via EscrowFinish...");
      const seed = process.env.XRPL_APP_WALLET_SEED;
      if (!seed) throw new Error("Missing XRPL_APP_WALLET_SEED");

      const appWallet = Wallet.fromSeed(seed);
      settlementTx = await finishEscrow(appWallet, escrowOwner, escrowSequence, challengeId);
      console.log("[Verify] Settlement:", settlementTx);
    }

    return NextResponse.json({
      success: true,
      proofCid: upload.cid,
      proofUrl: upload.privateUrl,
      verification,
      settlementTx,
    });
  } catch (error) {
    console.error("[Verify] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
