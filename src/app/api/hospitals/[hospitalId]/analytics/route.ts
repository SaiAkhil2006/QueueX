import { NextResponse } from "next/server";
import { getHospitalAnalyticsSummary } from "@/features/analytics/services/analytics.server";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const summary = await getHospitalAnalyticsSummary(hospitalId);
    return NextResponse.json({ data: summary });
  } catch (error) {
    console.error("GET /api/hospitals/[hospitalId]/analytics error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
