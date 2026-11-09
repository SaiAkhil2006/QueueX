import { NextRequest, NextResponse } from "next/server";
import { checkDoctorAvailability } from "@/features/schedules/services/schedules.server";
import type { ApiResponse } from "@/types/common";

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

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const time = searchParams.get("time") || undefined;

    if (!doctorId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Doctor ID query parameter (doctorId) is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Date query parameter (date: YYYY-MM-DD) is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const result = await checkDoctorAvailability(
      hospitalId,
      doctorId,
      date,
      time
    );

    return NextResponse.json<ApiResponse<typeof result>>({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error checking doctor availability";

    const status = message.includes("not found") ? 404 : 500;

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }
}
