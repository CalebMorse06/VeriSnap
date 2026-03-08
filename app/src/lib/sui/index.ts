/**
 * SUI Integration for VeriSnap
 *
 * SUI is the proof-of-completion layer — NFT trophies minted on-chain
 * for every verified challenge. Rich on-chain metadata makes these
 * displayable in any SUI wallet or explorer.
 *
 * Architecture:
 * - XRPL: financial settlement (escrow, payout)
 * - SUI: proof layer (NFT trophies with verification data)
 */
import { SuiGraphQLClient } from "@mysten/sui/graphql";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";

const SUI_NETWORK = (process.env.SUI_NETWORK as "testnet" | "devnet" | "mainnet") || "testnet";
const SUI_NFT_PACKAGE_ID = process.env.SUI_NFT_PACKAGE_ID || "";

const GRAPHQL_URLS: Record<string, string> = {
  testnet: "https://sui-testnet.mystenlabs.com/graphql",
  devnet: "https://sui-devnet.mystenlabs.com/graphql",
  mainnet: "https://sui-mainnet.mystenlabs.com/graphql",
};

let client: SuiGraphQLClient | null = null;

function getClient(): SuiGraphQLClient {
  if (!client) {
    client = new SuiGraphQLClient({ url: GRAPHQL_URLS[SUI_NETWORK] || GRAPHQL_URLS.testnet, network: SUI_NETWORK });
  }
  return client;
}

function getKeypair(): Ed25519Keypair {
  const secret = process.env.SUI_APP_WALLET_SECRET;
  if (!secret) throw new Error("SUI_APP_WALLET_SECRET not configured");

  // Support bech32 (suiprivkey1...) format
  if (secret.startsWith("suiprivkey")) {
    return Ed25519Keypair.fromSecretKey(secret);
  }
  // Raw base64 secret key
  const bytes = Buffer.from(secret, "base64");
  return Ed25519Keypair.fromSecretKey(bytes);
}

export interface MintResult {
  digest: string;
  objectId: string;
  explorerUrl: string;
}

/**
 * Mint a VeriSnap trophy NFT on SUI.
 * Called server-side by the app wallet after challenge verification passes.
 */
export async function mintTrophyNFT(params: {
  challengeId: string;
  title: string;
  proofCid: string;
  confidence: number;
  winnerAddress?: string;
}): Promise<MintResult> {
  if (!SUI_NFT_PACKAGE_ID) {
    throw new Error("SUI_NFT_PACKAGE_ID not configured — deploy sui-nft package first");
  }

  const suiClient = getClient();
  const keypair = getKeypair();
  const senderAddress = keypair.getPublicKey().toSuiAddress();

  const tx = new Transaction();
  tx.setSender(senderAddress);
  tx.setGasBudget(10_000_000); // 0.01 SUI

  tx.moveCall({
    target: `${SUI_NFT_PACKAGE_ID}::trophy::mint`,
    arguments: [
      tx.pure.string(params.challengeId),
      tx.pure.string(params.title),
      tx.pure.string(params.proofCid || ""),
      tx.pure.u64(Math.round(params.confidence)),
      tx.pure.u64(Math.floor(Date.now() / 1000)),
      tx.pure.address(params.winnerAddress || senderAddress),
    ],
  });

  const result = await suiClient.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    include: { effects: true },
  });

  // Extract digest and created object ID from the tagged union result
  let digest = "";
  let objectId = "";

  if (result.$kind === "Transaction" && result.Transaction) {
    digest = result.Transaction.digest;
    // Find created objects in effects
    const effects = result.Transaction.effects;
    if (effects && effects.changedObjects) {
      for (const obj of effects.changedObjects) {
        if (obj.idOperation === "Created" && obj.objectId !== effects.gasObject?.objectId) {
          objectId = obj.objectId;
          break;
        }
      }
    }
  }

  const explorerBase = SUI_NETWORK === "mainnet"
    ? "https://suiscan.xyz/mainnet"
    : `https://suiscan.xyz/${SUI_NETWORK}`;

  return {
    digest,
    objectId,
    explorerUrl: `${explorerBase}/tx/${digest}`,
  };
}

/**
 * Generate a new SUI keypair for initial setup.
 * Run once, save the secret to SUI_APP_WALLET_SECRET env var.
 */
export function generateKeypair(): { address: string; secretKey: string } {
  const keypair = new Ed25519Keypair();
  return {
    address: keypair.getPublicKey().toSuiAddress(),
    secretKey: keypair.getSecretKey(),
  };
}

/**
 * Get balance of the app wallet on SUI.
 */
export async function getBalance(address?: string): Promise<string> {
  const suiClient = getClient();
  const addr = address || getKeypair().getPublicKey().toSuiAddress();
  const balance = await suiClient.getBalance({ owner: addr });
  return String(balance);
}
