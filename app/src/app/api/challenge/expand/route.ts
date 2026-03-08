import { NextResponse } from "next/server";
import { expandTitleSchema } from "@/lib/schemas";
import { expandTitle } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = expandTitleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Title must be 3-200 characters" },
        { status: 400 }
      );
    }

    const result = await expandTitle(parsed.data.title);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (e) {
    console.error("Expand API error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to expand title" },
      { status: 500 }
    );
  }
}
