import { NextRequest, NextResponse } from "next/server";
import {
  getSessionsByHospital,
  createSession,
} from "@/features/sessions/services/sessions.server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/common";
import type { OPDSessionStatus } from "@/types/scheduling";

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
    const status = (searchParams.get("status") as OPDSessionStatus) || undefined;
    const date = searchParams.get("date") || undefined;
    const view =
      (searchParams.get("view") as "all" | "today" | "upcoming" | "past") ||
      undefined;

    const sessions = await getSessionsByHospital(hospitalId, {
      doctorId,
      departmentId,
      status,
      date,
      view,
    });

    return NextResponse.json<ApiResponse<typeof sessions>>({
      success: true,
      data: sessions,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching OPD sessions";
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

    const newSession = await createSession(hospitalId, {
      ...body,
      hospitalId,
    });

    return NextResponse.json<ApiResponse<typeof newSession>>(
      {
        success: true,
        data: newSession,
        message: "OPD session created successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
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
      err instanceof Error ? err.message : "Error creating OPD session";

    const status = message.includes("not found")
      ? 404
      : message.includes("inactive") ||
        message.includes("schedule") ||
        message.includes("overlap") ||
        message.includes("belongs to")
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
