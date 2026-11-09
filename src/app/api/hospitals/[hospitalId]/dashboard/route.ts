import { NextRequest, NextResponse } from "next/server";
import { getStaffDashboardData } from "@/features/dashboard/services/dashboard.server";
import type { ApiResponse } from "@/types/common";
import type { DashboardData } from "@/features/dashboard/types";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;

    if (!hospitalId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Hospital ID is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const data = await getStaffDashboardData(hospitalId);

    return NextResponse.json<ApiResponse<DashboardData>>({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error aggregating staff operational dashboard data";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
