import { getSupabaseAdmin } from "@/lib/supabase";
import { finishEscrow, Wallet } from "@/lib/xrpl";

export interface ResolutionResult {
  resolved: boolean;
  outcome?: "resolved_pass" | "resolved_fail";
  reasoning?: string;
  settlementTx?: string;
  error?: string;
}

const VOTE_THRESHOLD = 3;

/**
 * Resolve a dispute based on votes + AI re-verification.
 * Idempotent — returns early if already resolved.
 */
export async function resolveDispute(disputeId: string): Promise<ResolutionResult> {
  const sb = getSupabaseAdmin();
  if (!sb) return { resolved: false, error: "Database unavailable" };

  // 1. Fetch dispute
  const { data: dispute, error: fetchErr } = await sb
    .from("disputes")
    .select("*")
    .eq("id", disputeId)
    .single();

  if (fetchErr || !dispute) {
    return { resolved: false, error: "Dispute not found" };
  }

  if (dispute.status !== "open") {
    return { resolved: false, error: "Already resolved" };
  }

  // 2. Check if conditions are met
  const totalVotes = (dispute.votes_pass || 0) + (dispute.votes_fail || 0);
  const deadlinePassed = new Date(dispute.vote_deadline) <= new Date();

  if (totalVotes < VOTE_THRESHOLD && !deadlinePassed) {
    return { resolved: false, error: "Not enough votes and deadline not passed" };
  }

  // 3. Determine outcome: vote majority, AI breaks ties
  const votesPass = dispute.votes_pass || 0;
  const votesFail = dispute.votes_fail || 0;

  let outcome: "resolved_pass" | "resolved_fail";
  let reasoning: string;

  if (votesPass > votesFail) {
    outcome = "resolved_pass";
    reasoning = `Community voted to pass (${votesPass}-${votesFail}).`;
  } else if (votesFail > votesPass) {
    outcome = "resolved_fail";
    reasoning = `Community voted to fail (${votesPass}-${votesFail}).`;
  } else {
    // Tie — AI breaks it
    if (dispute.ai_reverify_passed) {
      outcome = "resolved_pass";
      reasoning = `Tied vote (${votesPass}-${votesFail}). AI re-verification passed (${dispute.ai_reverify_confidence}% confidence), breaking tie in favor of pass.`;
    } else {
      outcome = "resolved_fail";
      reasoning = `Tied vote (${votesPass}-${votesFail}). AI re-verification failed, breaking tie in favor of fail.`;
    }
  }

  // 4. If PASSED, attempt settlement
  let settlementTx: string | undefined;

  if (outcome === "resolved_pass") {
    // Fetch challenge for escrow details
    const { data: challenge } = await sb
      .from("challenges")
      .select("*")
      .eq("id", dispute.challenge_id)
      .single();

    if (challenge?.escrow_owner && challenge?.escrow_sequence) {
      const seed = process.env.XRPL_APP_WALLET_SEED;
      if (seed) {
        const appWallet = Wallet.fromSeed(seed);
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            settlementTx = await finishEscrow(
              appWallet,
              challenge.escrow_owner,
              challenge.escrow_sequence,
              challenge.id
            );
            console.log("[DisputeResolve] Settlement TX:", settlementTx);
            break;
          } catch (err) {
            console.warn(`[DisputeResolve] Settlement attempt ${attempt} failed:`, err);
            if (attempt < 3) await new Promise(r => setTimeout(r, 1000 * attempt));
          }
        }
      }
    }

    // Update challenge status
    await sb
      .from("challenges")
      .update({
        status: settlementTx ? "SETTLED" : "PASSED",
        settlement_tx: settlementTx || undefined,
      })
      .eq("id", dispute.challenge_id);
  }

  // 5. Update dispute
  const resolvedAt = new Date().toISOString();
  await sb
    .from("disputes")
    .update({
      status: outcome,
      resolution_outcome: outcome,
      resolution_reasoning: reasoning,
      resolved_at: resolvedAt,
      settlement_tx: settlementTx || null,
    })
    .eq("id", disputeId);

  return {
    resolved: true,
    outcome,
    reasoning,
    settlementTx,
  };
}
