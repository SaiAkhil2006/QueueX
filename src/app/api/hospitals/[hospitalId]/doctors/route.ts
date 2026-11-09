import { NextRequest, NextResponse } from "next/server";
import {
  getDoctorsByHospital,
  createDoctor,
} from "@/features/doctors/services/doctors.server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/common";
import type { DoctorStatus, DoctorAvailability } from "@/types/doctor";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;

    if (!hospitalId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Hospital ID is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId") || undefined;
    const availability = (searchParams.get("availability") as DoctorAvailability) || undefined;
    const status = (searchParams.get("status") as DoctorStatus) || undefined;
    const search = searchParams.get("search") || undefined;

    const doctors = await getDoctorsByHospital(hospitalId, {
      departmentId,
      availability,
      status,
      search,
    });

    return NextResponse.json<ApiResponse<typeof doctors>>({
      success: true,
      data: doctors,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching doctors";
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;

    if (!hospitalId) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Hospital ID is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Invalid JSON request body",
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const newDoctor = await createDoctor(hospitalId, {
      ...body,
      hospitalId,
    });

    return NextResponse.json<ApiResponse<typeof newDoctor>>(
      {
        success: true,
        data: newDoctor,
        message: "Doctor registered successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const errorMessages = err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Validation failed: ${errorMessages}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const message =
      err instanceof Error ? err.message : "Error registering doctor";

    const status = message.includes("not found")
      ? 404
      : message.includes("inactive")
      ? 400
      : 500;

    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: message,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }
}
