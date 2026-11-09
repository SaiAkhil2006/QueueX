import { NextResponse } from "next/server";
import { getHospitalPredictionMetrics } from "@/features/predictions/services/predictions.server";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const metrics = await getHospitalPredictionMetrics(hospitalId);
    return NextResponse.json({ data: metrics });
  } catch (error) {
    console.error("GET /api/hospitals/[hospitalId]/predictions/stats error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
