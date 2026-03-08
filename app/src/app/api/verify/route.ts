import { NextRequest, NextResponse } from "next/server";
import { uploadProofPrivate, createVerifierAccessLink } from "@/lib/pinata";
import { verifyProof } from "@/lib/gemini";
import { finishEscrow, sendPayout, Wallet, dropsToXrp } from "@/lib/xrpl";
import { requireEnv } from "@/lib/env";
import { verifySchema } from "@/lib/schemas";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { validateProofServer } from "@/lib/proof-validation";

// Allow large video uploads (default is 4MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

interface VerifyRequest {
  challengeId: string;
  imageData: string; // base64
  challengeObjective: string;
  participantAddress?: string;
  escrowOwner?: string;
  escrowSequence?: number;
  capturedAt?: number; // timestamp when photo was taken
  acceptedAt?: number; // timestamp when challenge was accepted
  mediaType?: "image" | "video";
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

    const { challengeId, imageData, challengeObjective, participantAddress, escrowOwner, escrowSequence, acceptedAt, capturedAt } = parsed.data;
    const mediaType = (body.mediaType === "video" ? "video" : "image") as "image" | "video";

    const maxSize = mediaType === "video" ? 50_000_000 : 12_000_000;
    if (imageData.length > maxSize) {
      return NextResponse.json({ success: false, error: "Payload too large" }, { status: 413 });
    }

    // 0. Server-side proof validation
    const proofValidation = await validateProofServer(imageData, challengeId, acceptedAt, capturedAt);
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
    }, mediaType);
    console.log("[Verify] Uploaded:", upload.cid);

    // 2. Create scoped verifier link + verify with Gemini
    const verifierLink = await createVerifierAccessLink(upload.cid);
    console.log("[Verify] Verifying with Gemini...");
    const verification = await verifyProof(imageData, challengeObjective, `Private proof link: ${verifierLink}`, mediaType);
    console.log("[Verify] Result:", verification);

    // 3. Settle on XRPL (if passed and escrow details are provided)
    let settlementTx: string | null = null;
    let payoutTx: string | null = null;
    let settlementError: string | null = null;

    if (verification.passed && escrowOwner && typeof escrowSequence === "number") {
      console.log("[Verify] Settling on XRPL via EscrowFinish...");
      const seed = requireEnv("XRPL_APP_WALLET_SEED");
      const appWallet = Wallet.fromSeed(seed);

      // Retry settlement up to 3 times
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          settlementTx = await finishEscrow(appWallet, escrowOwner, escrowSequence, challengeId);
          console.log("[Verify] Settlement successful:", settlementTx);
          break;
        } catch (err) {
          console.error(`[Verify] Settlement attempt ${attempt} failed:`, err);
          if (attempt === 3) {
            settlementError = `Settlement failed after 3 attempts: ${String(err)}`;
          } else {
            await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
          }
        }
      }

      // 4. Send payout to participant's wallet (if provided and settlement succeeded)
      if (settlementTx && participantAddress && participantAddress.startsWith("r")) {
        console.log("[Verify] Sending payout to participant:", participantAddress);
        // Look up the challenge stake from Supabase to get the correct amount
        let payoutAmountXrp = 10; // fallback
        try {
          const { getSupabaseAdmin } = await import("@/lib/supabase");
          const supabase = getSupabaseAdmin();
          if (supabase) {
            const { data: challengeRow } = await supabase
              .from("challenges")
              .select("stake_amount_drops")
              .eq("id", challengeId)
              .single();
            if (challengeRow?.stake_amount_drops) {
              payoutAmountXrp = Number(dropsToXrp(String(challengeRow.stake_amount_drops)));
            }
          }
        } catch (err) {
          console.warn("[Verify] Could not look up stake amount:", err);
        }

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            payoutTx = await sendPayout(appWallet, participantAddress, payoutAmountXrp, challengeId);
            console.log("[Verify] Payout successful:", payoutTx);
            break;
          } catch (err) {
            console.error(`[Verify] Payout attempt ${attempt} failed:`, err);
            if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      proofCid: upload.cid,
      proofUrl: upload.privateUrl,
      verification,
      sceneDescription: verification.sceneDescription || "",
      settlementTx,
      payoutTx,
      settlementError,
      mediaType,
    });
  } catch (error) {
    console.error("[Verify] Error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
