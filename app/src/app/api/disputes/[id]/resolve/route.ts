import { NextRequest, NextResponse } from "next/server";
import { resolveDispute } from "@/lib/disputes/resolve";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: disputeId } = await params;
    const result = await resolveDispute(disputeId);

    if (!result.resolved) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.error === "Dispute not found" ? 404 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      outcome: result.outcome,
      reasoning: result.reasoning,
      settlementTx: result.settlementTx,
    });
  } catch (error) {
    console.error("[DisputeResolve] Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
