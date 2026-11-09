import { NextResponse } from "next/server";
import { getPatients, createPatient } from "@/features/patients/services/patients.server";
import { ZodError } from "zod";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ hospitalId: string }> }
) {
  try {
    const { hospitalId } = await params;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const gender = searchParams.get("gender") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : undefined;

    const patients = await getPatients(hospitalId, { search, status, gender, limit });
    return NextResponse.json({ patients });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve patients";
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

    const patient = await createPatient(hospitalId, body);
    return NextResponse.json({ patient }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", issues: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Failed to register patient";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
