import { NextRequest, NextResponse } from "next/server";
import {
  getSessionById,
  updateSession,
} from "@/features/sessions/services/sessions.server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/common";

interface RouteContext {
  params: Promise<{ hospitalId: string; sessionId: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { hospitalId, sessionId } = await context.params;

    if (!hospitalId || !sessionId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Hospital ID and Session ID are required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const session = await getSessionById(hospitalId, sessionId);

    if (!session) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `OPD Session '${sessionId}' not found`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof session>>({
      success: true,
      data: session,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching OPD session";
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
    const { hospitalId, sessionId } = await context.params;

    if (!hospitalId || !sessionId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Hospital ID and Session ID are required",
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

    const updated = await updateSession(hospitalId, sessionId, body);

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: "OPD session updated successfully",
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
      err instanceof Error ? err.message : "Error updating OPD session";
    const status = message.includes("not found") ? 404 : 400;

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
