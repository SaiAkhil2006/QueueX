import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/features/appointments/services/appointments.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await params;
    const { searchParams } = new URL(request.url);

    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    if (!doctorId || !date) {
      return NextResponse.json(
        { error: "Query parameters 'doctorId' and 'date' (YYYY-MM-DD) are required" },
        { status: 400 }
      );
    }

    const slots = await getAvailableSlots(hospitalId, { doctorId, date });
    return NextResponse.json({ slots });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate appointment slots";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
