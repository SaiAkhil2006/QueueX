import { NextRequest, NextResponse } from "next/server";
import { getPatientTrackingInfo } from "@/features/tracker/services/tracker.server";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

export async function GET(request: NextRequest) {
  try {
    const tokenDisplay = request.nextUrl.searchParams.get("tokenDisplay") || undefined;
    const entryId = request.nextUrl.searchParams.get("entryId") || undefined;
    const hospitalId = request.nextUrl.searchParams.get("hospitalId") || DEFAULT_HOSPITAL_ID;

    if (!tokenDisplay && !entryId) {
      return NextResponse.json(
        { error: "tokenDisplay or entryId query parameter is required" },
        { status: 400 }
      );
    }

    const info = await getPatientTrackingInfo(hospitalId, {
      tokenDisplay,
      entryId,
    });

    if (!info) {
      return NextResponse.json(
        { error: "Token not found or session expired" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: info });
  } catch (error) {
    console.error("GET /api/patients/track error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
