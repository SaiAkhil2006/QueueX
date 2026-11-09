import { NextRequest, NextResponse } from "next/server";
import {
  getScheduleById,
  createOrUpdateDoctorSchedule,
} from "@/features/schedules/services/schedules.server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/common";

interface RouteContext {
  params: Promise<{ hospitalId: string; scheduleId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { hospitalId, scheduleId } = await context.params;

    const schedule = await getScheduleById(hospitalId, scheduleId);

    if (!schedule) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Schedule with ID "${scheduleId}" not found`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof schedule>>({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching schedule";
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { hospitalId, scheduleId } = await context.params;

    const existing = await getScheduleById(hospitalId, scheduleId);
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Schedule with ID "${scheduleId}" not found`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
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

    const updated = await createOrUpdateDoctorSchedule(
      hospitalId,
      existing.doctorId,
      {
        ...existing,
        ...body,
      }
    );

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: "Schedule updated successfully",
      timestamp: new Date().toISOString(),
    });
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
      err instanceof Error ? err.message : "Error updating schedule";

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
