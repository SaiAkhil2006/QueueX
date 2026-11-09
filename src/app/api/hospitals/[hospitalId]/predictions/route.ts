import { NextResponse } from "next/server";
import {
  getPredictions,
  calculateQueuePredictions,
} from "@/features/predictions/services/predictions.server";
import { serializeTimestamps } from "@/lib/firebase/timestamps";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("sessionId") || undefined;
    const queueEntryId = url.searchParams.get("queueEntryId") || undefined;

    const predictions = await getPredictions(hospitalId, {
      sessionId,
      queueEntryId,
    });

    return NextResponse.json({
      data: serializeTimestamps(predictions),
    });
  } catch (error) {
    console.error("GET /api/hospitals/[hospitalId]/predictions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    const updated = await calculateQueuePredictions(hospitalId, sessionId);

    return NextResponse.json({
      data: serializeTimestamps(updated),
    });
  } catch (error) {
    console.error("POST /api/hospitals/[hospitalId]/predictions error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
