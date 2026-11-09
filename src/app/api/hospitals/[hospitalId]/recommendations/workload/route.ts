import { NextResponse } from "next/server";
import { analyzeDepartmentWorkload } from "@/features/optimization/services/optimization.server";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const url = new URL(req.url);
    const departmentId = url.searchParams.get("departmentId");

    if (!departmentId) {
      return NextResponse.json(
        { error: "departmentId query parameter is required" },
        { status: 400 }
      );
    }

    const workload = await analyzeDepartmentWorkload(hospitalId, departmentId);
    return NextResponse.json({ data: workload });
  } catch (error) {
    console.error("GET .../workload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
