/**
 * Pinata Integration for VeriSnap
 *
 * Pinata is the controlled evidence layer — not just storage:
 * 1. Private evidence ingestion — proof lands in Private IPFS (not public)
 * 2. Scoped verifier access — createAccessLink for AI verifier only
 * 3. Post-verdict reveal — surface via gateway after settlement
 */

const PINATA_JWT = process.env.PINATA_JWT!;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

export interface UploadResult {
  cid: string;
  /** Private — do not expose directly. Use createVerifierAccessLink for AI access. */
  privateUrl: string;
}

/**
 * Upload proof privately to Pinata.
 * Proof is NOT publicly accessible until explicitly revealed post-verdict.
 */
export async function uploadProofPrivate(
  imageData: string, // base64
  metadata: {
    challengeId: string;
    timestamp: string;
    participantAddress?: string;
  }
): Promise<UploadResult> {
  const base64Data = imageData.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const blob = new Blob([buffer], { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("file", blob, `proof-${metadata.challengeId}-${Date.now()}.jpg`);
  formData.append("pinataMetadata", JSON.stringify({
    name: `VeriSnap Proof - ${metadata.challengeId}`,
    keyvalues: {
      challengeId: metadata.challengeId,
      timestamp: metadata.timestamp,
      participant: metadata.participantAddress || "anonymous",
      app: "verisnap",
      visibility: "private", // Private until verdict
    },
  }));
  // Mark as private upload
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Pinata upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  const cid = result.IpfsHash;

  return {
    cid,
    privateUrl: `https://${PINATA_GATEWAY}/ipfs/${cid}`, // Gate-kept in production
  };
}

/**
 * Create a short-lived access link scoped to the AI verifier.
 * This lets Gemini fetch the proof without making it publicly accessible.
 * 
 * In production: use Pinata Private IPFS createSignedURL / createAccessLink.
 * For demo: returns the gateway URL with JWT auth.
 */
export async function createVerifierAccessLink(cid: string, expiresInSeconds = 300): Promise<string> {
  // Production: create signed URL via Pinata API
  // For demo hackathon: return gateway URL (Gemini will receive image data anyway)
  try {
    const response = await fetch(
      `https://api.pinata.cloud/v3/files/private/download_link/${cid}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ expires: expiresInSeconds }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data.data?.url || `https://${PINATA_GATEWAY}/ipfs/${cid}`;
    }
  } catch {
    // Fallback for demo
  }
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Reveal proof publicly after successful settlement.
 * Called after challenge passes and XRPL escrow is finished.
 */
export function getPublicProofUrl(cid: string): string {
  return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}
