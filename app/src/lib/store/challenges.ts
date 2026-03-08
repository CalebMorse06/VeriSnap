// Simple client-side challenge store using sessionStorage
// In production, this would be backed by a database

export type ChallengeVisibility = "private" | "friends" | "public";

export interface ChallengeData {
  id: string;
  title: string;
  description: string;
  objective: string;
  location: { name: string; lat: number; lng: number };
  stakeAmount: number; // in drops
  durationMinutes: number;
  creatorAddress: string;
  challengeMode?: "self" | "versus" | "bounty";
  opponentAddress?: string;
  acceptorAddress?: string;
  status: "DRAFT" | "FUNDED" | "ACCEPTED" | "PROOF_SUBMITTED" | "VERIFYING" | "PASSED" | "FAILED" | "SETTLED" | "EXPIRED" | "DISPUTED";
  visibility: ChallengeVisibility;
  createdAt: number;
  expiresAt: number;
  acceptedAt?: number;
  resolvedAt?: number;
  escrowSequence?: number;
  escrowTxHash?: string;
  escrowOwner?: string;
  proofCid?: string;
  proofUrl?: string;
  proofRevealed?: boolean;
  verificationResult?: {
    passed: boolean;
    confidence: number;
    reasoning: string;
    sceneDescription?: string;
  };
  settlementTx?: string;
}

const STORAGE_KEY = "verisnap_challenges";

// Demo challenges
const DEMO_CHALLENGES: ChallengeData[] = [
  {
    id: "campanile-1",
    title: "Visit the KU Campanile",
    description: "Prove you're at the iconic KU Campanile bell tower. This 120-foot tall campanile is one of the most recognizable landmarks at the University of Kansas.",
    objective: "Take a clear photo showing the KU Campanile bell tower. The tower must be clearly visible and recognizable in the image.",
    location: { name: "KU Campanile, Lawrence, KS", lat: 38.9543, lng: -95.2558 },
    stakeAmount: 20_000_000,
    durationMinutes: 20,
    creatorAddress: "rVeriSnapDemo123",
    status: "FUNDED",
    visibility: "private",
    createdAt: Date.now() - 3600000,
    expiresAt: Date.now() + 86400000,
  },
];

export function getChallenges(): ChallengeData[] {
  if (typeof window === "undefined") return DEMO_CHALLENGES;
  
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChallengeData[];
      // Merge with demo challenges, avoiding duplicates
      const ids = new Set(parsed.map(c => c.id));
      return [...parsed, ...DEMO_CHALLENGES.filter(c => !ids.has(c.id))];
    }
  } catch (err) { console.warn("[Store] Failed to read challenges:", err); }

  return DEMO_CHALLENGES;
}

export function getChallenge(id: string): ChallengeData | null {
  const challenges = getChallenges();
  return challenges.find(c => c.id === id) || null;
}

export function saveChallenge(challenge: ChallengeData): void {
  if (typeof window === "undefined") return;

  const challenges = getChallenges().filter(c => c.id !== challenge.id);
  challenges.unshift(challenge);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
}

function dispatchSyncEvent(ok: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("verisnap:sync", { detail: { ok } }));
  }
}

async function mirrorCreateToApi(challenge: ChallengeData) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challenge),
      });
      if (res.ok) {
        console.log("[Mirror] Created challenge synced:", challenge.id);
        dispatchSyncEvent(true);
        return;
      }
      console.warn(`[Mirror] Create sync attempt ${attempt} failed: ${res.status}`);
    } catch (err) {
      console.warn(`[Mirror] Create sync attempt ${attempt} error:`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  dispatchSyncEvent(false);
}

async function mirrorPatchToApi(id: string, updates: Partial<ChallengeData>) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(`/api/challenges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        console.log("[Mirror] Patch synced:", id);
        dispatchSyncEvent(true);
        return;
      }
      console.warn(`[Mirror] Patch sync attempt ${attempt} failed: ${res.status}`);
    } catch (err) {
      console.warn(`[Mirror] Patch sync attempt ${attempt} error:`, err);
    }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }
  dispatchSyncEvent(false);
}

export function updateChallenge(id: string, updates: Partial<ChallengeData>): ChallengeData | null {
  const challenge = getChallenge(id);
  if (!challenge) return null;

  const updated = { ...challenge, ...updates };
  saveChallenge(updated);
  if (typeof window !== "undefined") void mirrorPatchToApi(id, updates);
  return updated;
}

export function createChallenge(data: Omit<ChallengeData, "id" | "status" | "createdAt" | "expiresAt" | "visibility"> & { challengeMode?: "self" | "versus" | "bounty" }): ChallengeData {
  const challenge: ChallengeData = {
    ...data,
    id: `challenge-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    status: "FUNDED",
    visibility: data.challengeMode === "bounty" ? "public" : "private",
    challengeMode: data.challengeMode || "versus",
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000, // 24 hours
  };

  saveChallenge(challenge);
  if (typeof window !== "undefined") void mirrorCreateToApi(challenge);
  return challenge;
}

// Get active challenge (accepted but not settled)
export function getActiveChallenge(): ChallengeData | null {
  const challenges = getChallenges();
  return challenges.find(c => 
    c.status === "ACCEPTED" || 
    c.status === "PROOF_SUBMITTED" || 
    c.status === "VERIFYING"
  ) || null;
}
