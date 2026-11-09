import { NextResponse } from "next/server";
import { getAppointmentById } from "@/features/appointments/services/appointments.server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hospitalId: string; appointmentId: string }> }
) {
  try {
    const { hospitalId, appointmentId } = await params;
    const appointment = await getAppointmentById(hospitalId, appointmentId);

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve appointment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
