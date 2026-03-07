import { NextRequest, NextResponse } from "next/server";
import { uploadProofPrivate, createVerifierAccessLink } from "@/lib/pinata";
import { verifyProof } from "@/lib/gemini";
import { finishEscrow, Wallet } from "@/lib/xrpl";
import { requireEnv } from "@/lib/env";
import { verifySchema } from "@/lib/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateProofServer } from "@/lib/proof-validation";

interface VerifyRequest {
  challengeId: string;
  imageData: string; // base64
  challengeObjective: string;
  participantAddress?: string;
  escrowOwner?: string;
  escrowSequence?: number;
  capturedAt?: number; // timestamp when photo was taken
  acceptedAt?: number; // timestamp when challenge was accepted
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`verify:${ip}`, 20, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const body: VerifyRequest = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid verify payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId, imageData, challengeObjective, participantAddress, escrowOwner, escrowSequence } = parsed.data;
    const acceptedAt = (parsed.data as VerifyRequest).acceptedAt;

    if (imageData.length > 12_000_000) {
      return NextResponse.json({ success: false, error: "Image payload too large" }, { status: 413 });
    }

    // 0. Server-side proof validation
    const proofValidation = await validateProofServer(imageData, challengeId, acceptedAt);
    if (!proofValidation.valid) {
      console.log("[Verify] Proof validation failed:", proofValidation.errors);
      return NextResponse.json({ 
        success: false, 
        error: proofValidation.errors.join("; "),
        validationErrors: proofValidation.errors,
      }, { status: 400 });
    }
    if (proofValidation.warnings.length > 0) {
      console.log("[Verify] Proof validation warnings:", proofValidation.warnings);
    }

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
      const seed = requireEnv("XRPL_APP_WALLET_SEED");
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
