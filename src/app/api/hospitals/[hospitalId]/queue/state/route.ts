import { NextResponse } from "next/server";
import { getSessionQueueState } from "@/features/queue/services/queue.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Query parameter 'sessionId' is required" }, { status: 400 });
    }

    const state = await getSessionQueueState(hospitalId, sessionId);
    return NextResponse.json({ state });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve session queue state";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
