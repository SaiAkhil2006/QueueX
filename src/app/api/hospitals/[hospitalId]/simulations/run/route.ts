import { NextResponse } from "next/server";
import { runDisruptionSimulation } from "@/features/simulations/services/simulations.server";
import type { SimulationParams } from "@/types/simulation";

interface RouteContext {
  params: Promise<{ hospitalId: string }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { hospitalId } = await context.params;
    const body: SimulationParams = await req.json();

    if (!body.scenario) {
      return NextResponse.json(
        { error: "scenario parameter is required" },
        { status: 400 }
      );
    }

    const result = await runDisruptionSimulation(hospitalId, body);
    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("POST .../simulations/run error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
