import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET /api/feed — public reveal feed (completed + public challenges only)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = parseInt(searchParams.get("offset") || "0");

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  // Only fetch resolved PUBLIC challenges with revealed proof
  const { data, error } = await supabase
    .from("challenges")
    .select(`
      id, title, description, objective,
      location_name, stake_amount_drops,
      status, visibility, resolved_at,
      proof_cid, proof_revealed,
      verification_passed, verification_confidence,
      settlement_tx
    `)
    .eq("visibility", "public")
    .eq("proof_revealed", true)
    .in("status", ["PASSED", "FAILED", "SETTLED"])
    .order("resolved_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Feed fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch feed" },
      { status: 500 }
    );
  }

  // Transform for client
  const feed = (data || []).map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    objective: c.objective,
    locationName: c.location_name,
    stakeXrp: c.stake_amount_drops / 1_000_000,
    status: c.status,
    passed: c.verification_passed,
    confidence: c.verification_confidence,
    proofCid: c.proof_cid,
    settlementTx: c.settlement_tx,
    resolvedAt: c.resolved_at,
  }));

  return NextResponse.json({
    success: true,
    feed,
    hasMore: feed.length === limit,
  });
}
