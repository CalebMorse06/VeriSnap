export type ChallengeStatus = 
  | 'DRAFT'
  | 'FUNDED'
  | 'ACCEPTED'
  | 'PROOF_SUBMITTED'
  | 'VERIFYING'
  | 'PASSED'
  | 'FAILED'
  | 'SETTLED'
  | 'EXPIRED';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  objective: string;
  location?: {
    name: string;
    lat: number;
    lng: number;
  };
  stakeAmount: number; // in drops (XRP)
  creatorAddress: string;
  participantAddress?: string;
  status: ChallengeStatus;
  proofCid?: string; // Pinata CID
  verificationResult?: {
    passed: boolean;
    confidence: number;
    reasoning: string;
  };
  xrpTxHash?: string;
  createdAt: Date;
  expiresAt?: Date;
}

export interface ProofSubmission {
  challengeId: string;
  imageData: string; // base64
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
}
