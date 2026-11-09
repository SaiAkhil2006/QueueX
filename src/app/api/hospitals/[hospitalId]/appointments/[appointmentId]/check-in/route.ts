import { NextResponse } from "next/server";
import { checkInAppointment } from "@/features/appointments/services/appointments.server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ hospitalId: string; appointmentId: string }> }
) {
  try {
    const { hospitalId, appointmentId } = await params;
    const appointment = await checkInAppointment(hospitalId, appointmentId);
    return NextResponse.json({ appointment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check in appointment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
