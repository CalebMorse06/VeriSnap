import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { resolveDispute } from "@/lib/disputes/resolve";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: disputeId } = await params;
    const { voterAddress, vote } = await request.json();

    if (!voterAddress || !vote || !["pass", "fail"].includes(vote)) {
      return NextResponse.json(
        { success: false, error: "Missing voterAddress or invalid vote (pass|fail)" },
        { status: 400 }
      );
    }

    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json({ success: false, error: "Database unavailable" }, { status: 503 });
    }

    // Check dispute exists and is open
    const { data: dispute, error: disputeErr } = await sb
      .from("disputes")
      .select("*")
      .eq("id", disputeId)
      .single();

    if (disputeErr || !dispute) {
      return NextResponse.json({ success: false, error: "Dispute not found" }, { status: 404 });
    }

    if (dispute.status !== "open") {
      return NextResponse.json({ success: false, error: "Dispute is no longer open" }, { status: 400 });
    }

    if (new Date(dispute.vote_deadline) < new Date()) {
      return NextResponse.json({ success: false, error: "Voting period has ended" }, { status: 400 });
    }

    // Insert vote (unique constraint prevents duplicate)
    const voteId = `vote-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const { error: voteErr } = await sb.from("dispute_votes").insert({
      id: voteId,
      dispute_id: disputeId,
      voter_address: voterAddress,
      vote,
    });

    if (voteErr) {
      if (voteErr.code === "23505") {
        return NextResponse.json({ success: false, error: "Already voted on this dispute" }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: "Failed to cast vote" }, { status: 500 });
    }

    // Increment vote count
    const column = vote === "pass" ? "votes_pass" : "votes_fail";
    const newCount = (vote === "pass" ? dispute.votes_pass : dispute.votes_fail) + 1;
    await sb.from("disputes").update({ [column]: newCount }).eq("id", disputeId);

    // Check if total votes >= 3 → auto-resolve
    const totalVotes = newCount + (vote === "pass" ? dispute.votes_fail : dispute.votes_pass);
    if (totalVotes >= 3) {
      try {
        await resolveDispute(disputeId);
      } catch (err) {
        console.warn("[Vote] Auto-resolve failed:", err);
      }
    }

    // Fetch updated dispute
    const { data: updated } = await sb
      .from("disputes")
      .select("*")
      .eq("id", disputeId)
      .single();

    return NextResponse.json({ success: true, dispute: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
