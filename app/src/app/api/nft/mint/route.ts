import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(`nft-mint:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
    }

    const body = await request.json();
    const { challengeId, proofCid, challengeTitle, confidence } = body;

    if (!challengeId) {
      return NextResponse.json({ success: false, error: "challengeId required" }, { status: 400 });
    }

    // Try SUI first (preferred for rich on-chain metadata), fall back to XRPL
    const suiPackageId = process.env.SUI_NFT_PACKAGE_ID;
    const suiSecret = process.env.SUI_APP_WALLET_SECRET;

    if (suiPackageId && suiSecret) {
      // Mint on SUI
      console.log("[NFT] Minting on SUI for challenge:", challengeId);
      const { mintTrophyNFT } = await import("@/lib/sui");
      const result = await mintTrophyNFT({
        challengeId,
        title: challengeTitle || "VeriSnap Challenge",
        proofCid: proofCid || "",
        confidence: confidence || 0,
      });
      console.log("[NFT] SUI mint:", result.digest, "Object:", result.objectId);

      return NextResponse.json({
        success: true,
        chain: "sui",
        txHash: result.digest,
        objectId: result.objectId,
        explorerUrl: result.explorerUrl,
      });
    }

    // Fallback: mint on XRPL
    console.log("[NFT] Minting on XRPL for challenge:", challengeId);
    const { mintNFT, Wallet } = await import("@/lib/xrpl");
    const { requireEnv } = await import("@/lib/env");
    const seed = requireEnv("XRPL_APP_WALLET_SEED");
    const appWallet = Wallet.fromSeed(seed);
    const result = await mintNFT(appWallet, challengeId, proofCid, challengeTitle);
    console.log("[NFT] XRPL mint:", result.txHash);

    return NextResponse.json({
      success: true,
      chain: "xrpl",
      txHash: result.txHash,
      nftTokenId: result.nftTokenId,
      explorerUrl: `https://testnet.xrpl.org/transactions/${result.txHash}`,
    });
  } catch (error) {
    console.error("[NFT] Mint error:", error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
