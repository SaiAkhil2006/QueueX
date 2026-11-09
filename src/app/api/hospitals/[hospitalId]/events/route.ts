import { NextRequest, NextResponse } from "next/server";
import { getOperationalEvents } from "@/features/sessions/services/sessions.server";
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
    const sessionId = searchParams.get("sessionId") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const events = await getOperationalEvents(hospitalId, {
      sessionId,
      limit: isNaN(limit) ? 50 : limit,
    });

    return NextResponse.json<ApiResponse<typeof events>>({
      success: true,
      data: events,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching operational events";
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
