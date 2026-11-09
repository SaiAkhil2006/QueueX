import { NextRequest, NextResponse } from "next/server";
import {
  getHospitalById,
  updateHospitalById,
} from "@/features/hospital/services/hospital.server";
import { ZodError } from "zod";
import type { ApiResponse } from "@/types/common";

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

    const hospital = await getHospitalById(hospitalId);

    if (!hospital) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: `Hospital with ID "${hospitalId}" not found`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<typeof hospital>>({
      success: true,
      data: hospital,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error fetching hospital";
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

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const updated = await updateHospitalById(hospitalId, body);

    return NextResponse.json<ApiResponse<typeof updated>>({
      success: true,
      data: updated,
      message: "Hospital configuration updated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const errorMessages = err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
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
      err instanceof Error ? err.message : "Internal server error updating hospital";

    const status = message.includes("not found") ? 404 : 500;

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
