import { NextRequest, NextResponse } from "next/server";
import {
  getDepartmentsByHospital,
  createDepartment,
} from "@/features/departments/services/departments.server";
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

    const departments = await getDepartmentsByHospital(hospitalId);

    return NextResponse.json<ApiResponse<typeof departments>>({
      success: true,
      data: departments,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Error fetching departments";
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

    const newDepartment = await createDepartment(hospitalId, {
      ...body,
      hospitalId,
    });

    return NextResponse.json<ApiResponse<typeof newDepartment>>(
      {
        success: true,
        data: newDepartment,
        message: "Department created successfully",
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
      err instanceof Error ? err.message : "Error creating department";

    const status = message.includes("already exists") ? 409 : 500;

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
