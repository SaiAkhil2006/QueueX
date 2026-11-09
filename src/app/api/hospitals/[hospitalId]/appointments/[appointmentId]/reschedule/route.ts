import { NextResponse } from "next/server";
import { rescheduleAppointment } from "@/features/appointments/services/appointments.server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string; appointmentId: string }> }
) {
  try {
    const { hospitalId, appointmentId } = await params;
    const body = await request.json();

    if (!body.newDate || !body.newTime) {
      return NextResponse.json(
        { error: "Fields 'newDate' (YYYY-MM-DD) and 'newTime' (HH:MM) are required" },
        { status: 400 }
      );
    }

    const appointment = await rescheduleAppointment(
      hospitalId,
      appointmentId,
      body.newDate,
      body.newTime
    );
    return NextResponse.json({ appointment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to reschedule appointment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
