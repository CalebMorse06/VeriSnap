import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOrSetUserId } from "@/lib/identity";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`challenges-list:${ip}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 });
  }

  const uid = await getOrSetUserId();
  const { data, error } = await supabase
    .from("challenges")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const challenges = (data ?? [])
    .filter((c) => {
      const isCreator = c.creator_id === uid;
      // Non-owners should not see private/friends-only challenges in list endpoint
      if (!isCreator && c.visibility !== "public") return false;
      return true;
    })
    .map((c) => {
      const isCreator = c.creator_id === uid;
      const canViewProof = isCreator || c.proof_revealed === true || c.visibility === "public";
      return canViewProof
        ? c
        : {
            ...c,
            proof_cid: null,
          };
    });

  return NextResponse.json({ success: true, challenges });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`challenges-create:${ip}`, 60, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "Supabase not configured" }, { status: 503 });
  }

  const creatorId = await getOrSetUserId();
  const body = await request.json();

  const id = body.id || `challenge-${Date.now()}`;

  const row = {
    id,
    creator_id: creatorId,
    title: body.title,
    description: body.description,
    objective: body.objective,
    location_name: body.location?.name ?? "Unknown",
    location_lat: Number(body.location?.lat ?? 0),
    location_lng: Number(body.location?.lng ?? 0),
    stake_amount_drops: Number(body.stakeAmount ?? 0),
    duration_minutes: Number(body.durationMinutes ?? 20),
    status: body.status ?? "FUNDED",
    visibility: body.visibility ?? "private",
    proof_revealed: Boolean(body.proofRevealed ?? false),
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    escrow_sequence: body.escrowSequence ?? null,
    escrow_tx_hash: body.escrowTxHash ?? null,
    escrow_owner: body.escrowOwner ?? null,
  };

  const { data, error } = await supabase.from("challenges").insert(row).select("*").single();

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, challenge: data });
}
