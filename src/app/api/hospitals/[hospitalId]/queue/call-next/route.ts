import { NextResponse } from "next/server";
import { callNextPatient } from "@/features/queue/services/queue.server";

export async function POST(
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

    const entry = await callNextPatient(hospitalId, sessionId);
    return NextResponse.json({ entry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to call next patient";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
