import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOrSetUserId } from "@/lib/identity";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 });

  const uid = await getOrSetUserId();
  const { data, error } = await supabase.from("challenges").select("*").eq("id", id).single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 404 });

  const isCreator = data.creator_id === uid;

  // Privacy guard: private challenges are not readable by non-owners
  if (!isCreator && data.visibility === "private") {
    return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
  }

  const canViewProof = isCreator || data.proof_revealed === true || data.visibility === "public";

  const challenge = canViewProof
    ? data
    : {
        ...data,
        proof_cid: null,
      };

  return NextResponse.json({ success: true, challenge });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 });

  const uid = await getOrSetUserId();
  const body = await request.json();

  const { data: existing, error: findErr } = await supabase.from("challenges").select("*").eq("id", id).single();
  if (findErr || !existing) return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });

  // ownership guard: creator can always edit; non-creator can only move to ACCEPTED/PROOF_SUBMITTED for participation
  if (existing.creator_id !== uid) {
    const allowed = ["ACCEPTED", "PROOF_SUBMITTED", "VERIFYING"];
    if (!allowed.includes(String(body.status ?? ""))) {
      return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.status !== undefined) updates.status = body.status;
  if (body.acceptedAt !== undefined) updates.accepted_at = new Date(body.acceptedAt).toISOString();
  if (body.proofCid !== undefined) updates.proof_cid = body.proofCid;
  if (body.settlementTx !== undefined) updates.settlement_tx = body.settlementTx;
  if (body.escrowSequence !== undefined) updates.escrow_sequence = body.escrowSequence;
  if (body.escrowTxHash !== undefined) updates.escrow_tx_hash = body.escrowTxHash;
  if (body.escrowOwner !== undefined) updates.escrow_owner = body.escrowOwner;
  if (body.verificationResult) {
    updates.verification_passed = Boolean(body.verificationResult.passed);
    updates.verification_confidence = Number(body.verificationResult.confidence ?? 0);
    updates.verification_reasoning = String(body.verificationResult.reasoning ?? "");
  }
  if (body.resolvedAt !== undefined) updates.resolved_at = new Date(body.resolvedAt).toISOString();
  if (body.visibility !== undefined) updates.visibility = body.visibility;
  if (body.proofRevealed !== undefined) updates.proof_revealed = Boolean(body.proofRevealed);

  const { data, error } = await supabase.from("challenges").update(updates).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, challenge: data });
}
