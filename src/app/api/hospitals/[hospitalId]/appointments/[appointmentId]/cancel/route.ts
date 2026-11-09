import { NextResponse } from "next/server";
import { cancelAppointment } from "@/features/appointments/services/appointments.server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string; appointmentId: string }> }
) {
  try {
    const { hospitalId, appointmentId } = await params;
    const body = await request.json().catch(() => ({}));

    const appointment = await cancelAppointment(hospitalId, appointmentId, body.reason);
    return NextResponse.json({ appointment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to cancel appointment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
