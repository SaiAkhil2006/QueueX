import { NextResponse } from "next/server";
import { updateQueuePriority } from "@/features/queue/services/queue.server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string; entryId: string }> }
) {
  try {
    const { hospitalId, entryId } = await params;
    const body = await request.json();

    if (!body.priority) {
      return NextResponse.json({ error: "Field 'priority' is required" }, { status: 400 });
    }

    const entry = await updateQueuePriority(hospitalId, entryId, body.priority);
    return NextResponse.json({ entry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update priority";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
