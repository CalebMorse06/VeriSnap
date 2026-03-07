import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getOrSetUserId } from "@/lib/identity";
import { z } from "zod";

const RevealSchema = z.object({
  visibility: z.enum(["private", "friends", "public"]),
});

// POST /api/challenges/[id]/reveal — update visibility after resolution
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const identity = await getOrSetUserId();

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "Database not configured" },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = RevealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid visibility value" },
      { status: 400 }
    );
  }

  const { visibility } = parsed.data;

  // Fetch challenge to verify ownership and status
  const { data: challenge, error: fetchError } = await supabase
    .from("challenges")
    .select("creator_id, status")
    .eq("id", id)
    .single();

  if (fetchError || !challenge) {
    return NextResponse.json(
      { success: false, error: "Challenge not found" },
      { status: 404 }
    );
  }

  // Only creator can change visibility
  if (challenge.creator_id !== identity) {
    return NextResponse.json(
      { success: false, error: "Not authorized" },
      { status: 403 }
    );
  }

  // Only allow visibility change after resolution
  if (!["PASSED", "FAILED", "SETTLED"].includes(challenge.status)) {
    return NextResponse.json(
      { success: false, error: "Challenge not yet resolved" },
      { status: 400 }
    );
  }

  // Update visibility and reveal proof if going public
  const { error: updateError } = await supabase
    .from("challenges")
    .update({
      visibility,
      proof_revealed: visibility !== "private",
    })
    .eq("id", id);

  if (updateError) {
    console.error("Reveal update error:", updateError);
    return NextResponse.json(
      { success: false, error: "Failed to update visibility" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    visibility,
    proofRevealed: visibility !== "private",
  });
}
