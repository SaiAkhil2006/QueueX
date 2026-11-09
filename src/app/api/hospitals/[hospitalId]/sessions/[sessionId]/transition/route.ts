import { NextRequest, NextResponse } from "next/server";
import { transitionSession } from "@/features/sessions/services/sessions.server";
import type { ApiResponse } from "@/types/common";
import type { SessionTransitionAction } from "@/features/sessions/types";

interface RouteContext {
  params: Promise<{ hospitalId: string; sessionId: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    const validActions: SessionTransitionAction[] = [
      "start",
      "pause",
      "resume",
      "complete",
      "cancel",
    ];

    if (!body.action || !validActions.includes(body.action)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Action must be one of: ${validActions.join(", ")}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const result = await transitionSession(hospitalId, sessionId, {
      action: body.action,
      actorId: body.actorId,
      actorRole: body.actorRole,
      reason: body.reason,
      metadata: body.metadata,
    });

    return NextResponse.json<
      ApiResponse<typeof result.session> & { eventId: string }
    >(
      {
        success: true,
        data: result.session,
        eventId: result.eventId,
        message: `OPD session successfully transitioned via '${body.action}'`,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error transitioning OPD session";
    const status = message.includes("not found")
      ? 404
      : message.includes("Cannot") || message.includes("already has")
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
