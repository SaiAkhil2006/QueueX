import { NextResponse } from "next/server";
import { startConsultation } from "@/features/queue/services/queue.server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ hospitalId: string; entryId: string }> }
) {
  try {
    const { hospitalId, entryId } = await params;
    const entry = await startConsultation(hospitalId, entryId);
    return NextResponse.json({ entry });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start consultation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
