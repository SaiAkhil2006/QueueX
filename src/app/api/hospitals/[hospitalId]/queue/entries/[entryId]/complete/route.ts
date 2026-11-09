import { NextResponse } from "next/server";
import { completeConsultation } from "@/features/queue/services/queue.server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string; entryId: string }> }
) {
  try {
    const { hospitalId, entryId } = await params;
    const body = await request.json();

    const { entry, consultation } = await completeConsultation(hospitalId, entryId, {
      outcome: body.outcome || "routine_clear",
      notes: body.notes,
      delayReason: body.delayReason,
    });

    return NextResponse.json({ entry, consultation });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to complete consultation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
