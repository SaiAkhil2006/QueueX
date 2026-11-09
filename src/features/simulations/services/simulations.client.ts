import type { SimulationParams, SimulationResult } from "@/types/simulation";

export async function runSimulation(
  hospitalId: string,
  params: SimulationParams
): Promise<SimulationResult> {
  const res = await fetch(`/api/hospitals/${hospitalId}/simulations/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to execute simulation");
  }

  const json = await res.json();
  return json.data;
}
