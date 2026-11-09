import { NextResponse } from "next/server";
import {
  getAppointments,
  createAppointment,
  createWalkInAppointment,
} from "@/features/appointments/services/appointments.server";
import { ZodError } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await params;
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date") || undefined;
    const doctorId = searchParams.get("doctorId") || undefined;
    const departmentId = searchParams.get("departmentId") || undefined;
    const patientId = searchParams.get("patientId") || undefined;
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const appointments = await getAppointments(hospitalId, {
      date,
      doctorId,
      departmentId,
      patientId,
      status,
      limit,
    });

    return NextResponse.json({ appointments });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve appointments";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await params;
    const body = await request.json();

    if (body.isWalkIn || body.appointmentType === "walk_in") {
      const appointment = await createWalkInAppointment(hospitalId, {
        patientId: body.patientId,
        doctorId: body.doctorId,
        notes: body.notes,
      });
      return NextResponse.json({ appointment }, { status: 201 });
    }

    const appointment = await createAppointment(hospitalId, body);
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to book appointment";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
