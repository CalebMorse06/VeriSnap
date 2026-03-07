import { NextRequest, NextResponse } from "next/server";
import { uploadProofPrivate, createVerifierAccessLink } from "@/lib/pinata";
import { verifyProof } from "@/lib/gemini";
// import { settleChallenge } from "@/lib/xrpl";

interface VerifyRequest {
  challengeId: string;
  imageData: string; // base64
  challengeObjective: string;
  participantAddress?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const { challengeId, imageData, challengeObjective, participantAddress } = body;

    // 1. Upload proof to Pinata
    console.log("[Verify] Uploading to Pinata...");
    const upload = await uploadProofPrivate(imageData, {
      challengeId,
      timestamp: new Date().toISOString(),
      participantAddress,
    });
    console.log("[Verify] Uploaded:", upload.cid);

    // 2. Verify with Gemini
    console.log("[Verify] Verifying with Gemini...");
    const verification = await verifyProof(imageData, challengeObjective);
    console.log("[Verify] Result:", verification);

    // 3. Settle on XRPL (if passed)
    let settlementTx: string | null = null;
    if (verification.passed && participantAddress) {
      console.log("[Verify] Settling on XRPL...");
      // For demo: skip actual settlement, just return mock tx
      // settlementTx = await settleChallenge(participantAddress, "10000000", challengeId);
      settlementTx = `DEMO_TX_${Date.now()}`;
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
