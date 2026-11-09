import { NextResponse } from "next/server";
import { getPatientById, updatePatient } from "@/features/patients/services/patients.server";
import { ZodError } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hospitalId: string; patientId: string }> }
) {
  try {
    const { hospitalId, patientId } = await params;
    const patient = await getPatientById(hospitalId, patientId);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve patient";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string; patientId: string }> }
) {
  try {
    const { hospitalId, patientId } = await params;
    const body = await request.json();

    const patient = await updatePatient(hospitalId, patientId, body);
    return NextResponse.json({ patient });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to update patient profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
