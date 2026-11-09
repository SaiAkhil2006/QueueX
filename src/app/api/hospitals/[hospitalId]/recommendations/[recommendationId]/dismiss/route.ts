import { NextResponse } from "next/server";
import { dismissRecommendation } from "@/features/optimization/services/optimization.server";
import { serializeTimestamps } from "@/lib/firebase/timestamps";

interface RouteContext {
  params: Promise<{ hospitalId: string; recommendationId: string }>;
}

export async function POST(_req: Request, context: RouteContext) {
  try {
    const { hospitalId, recommendationId } = await context.params;
    const dismissed = await dismissRecommendation(hospitalId, recommendationId);
    return NextResponse.json({ data: serializeTimestamps(dismissed) });
  } catch (error) {
    console.error("POST .../dismiss error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
