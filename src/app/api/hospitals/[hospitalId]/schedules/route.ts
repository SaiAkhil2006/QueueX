import { NextRequest, NextResponse } from "next/server";
import {
  getSchedulesByHospital,
  createOrUpdateDoctorSchedule,
} from "@/features/schedules/services/schedules.server";
import { ZodError } from "zod";
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
    const doctorId = searchParams.get("doctorId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;

    const schedules = await getSchedulesByHospital(hospitalId, {
      doctorId,
      departmentId,
    });

    return NextResponse.json<ApiResponse<typeof schedules>>({
      success: true,
      data: schedules,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching schedules";
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

export async function POST(request: NextRequest, context: RouteContext) {
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid JSON request body",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!body.doctorId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Doctor ID is required to configure schedule",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const savedSchedule = await createOrUpdateDoctorSchedule(
      hospitalId,
      body.doctorId,
      body
    );

    return NextResponse.json<ApiResponse<typeof savedSchedule>>(
      {
        success: true,
        data: savedSchedule,
        message: "Doctor schedule saved successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const errorMessages = err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Validation failed: ${errorMessages}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Error saving doctor schedule";

    const status = message.includes("not found")
      ? 404
      : message.includes("Start time") || message.includes("Break")
      ? 400
      : 500;

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
