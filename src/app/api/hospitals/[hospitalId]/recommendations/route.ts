import { NextResponse } from "next/server";
import {
  getRecommendations,
  generateRecommendations,
} from "@/features/optimization/services/optimization.server";
import { serializeTimestamps } from "@/lib/firebase/timestamps";
import type { RecommendationStatus } from "@/types/intelligence";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const url = new URL(req.url);
    const departmentId = url.searchParams.get("departmentId") || undefined;
    const status = (url.searchParams.get("status") as RecommendationStatus) || undefined;

    const recs = await getRecommendations(hospitalId, { departmentId, status });
    return NextResponse.json({ data: serializeTimestamps(recs) });
  } catch (error) {
    console.error("GET /api/hospitals/[hospitalId]/recommendations error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const body = await req.json().catch(() => ({}));
    const { departmentId } = body;

    const generated = await generateRecommendations(hospitalId, departmentId);
    return NextResponse.json({ data: serializeTimestamps(generated) });
  } catch (error) {
    console.error("POST /api/hospitals/[hospitalId]/recommendations error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
