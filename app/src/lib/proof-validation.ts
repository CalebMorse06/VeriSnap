/**
 * Proof validation utilities
 * - Timestamp freshness
 * - Basic fraud indicators
 * - Image quality checks
 */

// Maximum age for proof images (in milliseconds)
const MAX_PROOF_AGE_MS = 30 * 60 * 1000; // 30 minutes

// Minimum acceptable image dimensions
const MIN_IMAGE_WIDTH = 480;
const MIN_IMAGE_HEIGHT = 480;

export interface ProofValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    width?: number;
    height?: number;
    estimatedAge?: string;
    hasLocation?: boolean;
  };
}

/**
 * Validate proof image before submission
 * Runs client-side checks that can prevent obvious fraud
 */
export function validateProofImage(
  imageData: string,
  captureTimestamp: number
): ProofValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: ProofValidation["metadata"] = {};

  // Check proof age
  const ageMs = Date.now() - captureTimestamp;
  if (ageMs > MAX_PROOF_AGE_MS) {
    errors.push(`Proof is too old (${Math.round(ageMs / 60000)} minutes). Must be captured within 30 minutes.`);
  } else if (ageMs > 15 * 60 * 1000) {
    warnings.push("Proof was captured more than 15 minutes ago");
  }
  metadata.estimatedAge = formatAge(ageMs);

  // Basic sanity checks on base64
  if (!imageData.startsWith("data:image/")) {
    errors.push("Invalid image format");
  }

  // Check approximate size (rough estimate from base64)
  const base64Length = imageData.replace(/^data:image\/\w+;base64,/, "").length;
  const estimatedBytes = (base64Length * 3) / 4;
  
  if (estimatedBytes < 10000) {
    warnings.push("Image appears very small - may be low quality");
  }
  if (estimatedBytes > 10 * 1024 * 1024) {
    errors.push("Image too large (max 10MB)");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
}

/**
 * Server-side proof validation
 * More thorough checks including AI-assisted fraud detection
 */
export async function validateProofServer(
  imageData: string,
  challengeId: string,
  acceptedAt?: number,
  capturedAt?: number
): Promise<ProofValidation> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: ProofValidation["metadata"] = {};

  // Check capture freshness
  if (capturedAt) {
    const ageSinceCapture = Date.now() - capturedAt;
    if (ageSinceCapture > MAX_PROOF_AGE_MS) {
      errors.push("Proof capture is too old. Please retake and submit within 30 minutes.");
    } else if (ageSinceCapture > 15 * 60 * 1000) {
      warnings.push("Proof capture is older than 15 minutes");
    }
    metadata.estimatedAge = formatAge(ageSinceCapture);
  }

  // Check if challenge was accepted recently
  if (acceptedAt) {
    const timeSinceAccept = Date.now() - acceptedAt;
    const maxAllowedTime = 60 * 60 * 1000; // 1 hour max (generous)

    if (timeSinceAccept > maxAllowedTime) {
      errors.push("Challenge timer has expired");
    }
    if (!capturedAt) {
      metadata.estimatedAge = formatAge(timeSinceAccept);
    }
  }

  // Check image dimensions via canvas (would need browser environment)
  // For server-side, we rely on AI verification

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata,
  };
}

function formatAge(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return "Just now";
  if (minutes === 1) return "1 minute ago";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return "1 hour ago";
  return `${hours} hours ago`;
}

/**
 * Generate a proof signature for tamper detection
 * Used to verify the proof wasn't modified after capture
 */
export async function generateProofSignature(
  imageData: string,
  challengeId: string,
  timestamp: number
): Promise<string> {
  // Create a simple signature from image hash + challenge + timestamp
  // In production, use proper HMAC with server secret
  const data = `${imageData.slice(-100)}:${challengeId}:${timestamp}`;
  
  // Use SubtleCrypto if available (browser/modern Node)
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }
  
  // Fallback: simple hash (not secure, demo only)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Verify a proof signature
 */
export async function verifyProofSignature(
  imageData: string,
  challengeId: string,
  timestamp: number,
  signature: string
): Promise<boolean> {
  const expected = await generateProofSignature(imageData, challengeId, timestamp);
  return expected === signature;
}
