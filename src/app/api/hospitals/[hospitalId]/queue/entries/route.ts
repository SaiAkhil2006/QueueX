import { NextResponse } from "next/server";
import { createQueueEntry } from "@/features/queue/services/queue.server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await params;
    const body = await request.json();

    if (!body.sessionId || !body.patientId) {
      return NextResponse.json(
        { error: "Fields 'sessionId' and 'patientId' are required" },
        { status: 400 }
      );
    }

    const entry = await createQueueEntry(hospitalId, body);
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to issue queue token";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
