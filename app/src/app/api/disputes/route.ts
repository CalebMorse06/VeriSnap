import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { verifyProof } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { challengeId, reason } = await request.json();
    if (!challengeId || !reason) {
      return NextResponse.json({ success: false, error: "Missing challengeId or reason" }, { status: 400 });
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
    }

    // Fetch the challenge
    const { data: challenge, error: challengeErr } = await sb
      .from("challenges")
      .select("*")
      .eq("id", challengeId)
      .single();

    if (challengeErr || !challenge) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    if (!challenge.proof_cid) {
      return NextResponse.json({ success: false, error: "No proof to dispute" }, { status: 400 });
    }

    // Check for existing open dispute
    const { data: existing } = await sb
      .from("disputes")
      .select("id")
      .eq("challenge_id", challengeId)
      .eq("status", "open")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: false, error: "Dispute already open for this challenge" }, { status: 409 });
    }

    // Re-verify with Gemini using a more lenient dispute prompt
    let reverifyResult = null;
    try {
      // Fetch the proof image from Pinata
      const proofUrl = `https://peach-random-penguin-753.mypinata.cloud/ipfs/${challenge.proof_cid}`;
      const imgRes = await fetch(proofUrl);
      if (imgRes.ok) {
        const buffer = await imgRes.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const imageData = `data:image/jpeg;base64,${base64}`;

        const disputeContext = `DISPUTE RE-VERIFICATION: The user is disputing a failed result. Reason: "${reason}". Re-evaluate with extra leniency - if there is any reasonable interpretation where the objective could be considered met, pass it.`;

        reverifyResult = await verifyProof(imageData, challenge.objective, disputeContext);
      }
    } catch (e) {
      console.error("[Disputes] Re-verify error:", e);
    }

    const disputeId = `dispute-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const voteDeadline = new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(); // 10 hours

    const dispute = {
      id: disputeId,
      challenge_id: challengeId,
      reason,
      proof_cid: challenge.proof_cid,
      ai_reverify_passed: reverifyResult?.passed ?? null,
      ai_reverify_confidence: reverifyResult?.confidence ?? null,
      ai_reverify_reasoning: reverifyResult?.reasoning ?? null,
      ai_reverify_scene_description: reverifyResult?.sceneDescription ?? null,
      vote_deadline: voteDeadline,
      votes_pass: 0,
      votes_fail: 0,
      status: "open",
    };

    const { error: insertErr } = await sb.from("disputes").insert(dispute);
    if (insertErr) {
      console.error("[Disputes] Insert error:", insertErr);
      return NextResponse.json({ success: false, error: "Failed to create dispute" }, { status: 500 });
    }

    // Update challenge status
    await sb.from("challenges").update({ status: "DISPUTED" }).eq("id", challengeId);

    return NextResponse.json({ success: true, dispute });
  } catch (error) {
    console.error("[Disputes] Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
    }

    const { data: disputes, error } = await sb
      .from("disputes")
      .select(`
        *,
        challenges (
          id, title, objective, location_name, stake_amount_drops
        )
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to fetch disputes" }, { status: 500 });
    }

    return NextResponse.json({ success: true, disputes: disputes || [] });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
