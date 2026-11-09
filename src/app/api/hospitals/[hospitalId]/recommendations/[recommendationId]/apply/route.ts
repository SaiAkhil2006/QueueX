import { NextResponse } from "next/server";
import { applyRecommendation } from "@/features/optimization/services/optimization.server";
import { serializeTimestamps } from "@/lib/firebase/timestamps";

interface RouteContext {
  params: Promise<{ hospitalId: string; recommendationId: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { hospitalId, recommendationId } = await context.params;
    const applied = await applyRecommendation(
      hospitalId,
      recommendationId,
      "admin",
      "opd-supervisor"
    );
    return NextResponse.json({ data: serializeTimestamps(applied) });
  } catch (error) {
    console.error("POST .../apply error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
