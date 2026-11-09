import type { Prediction } from "@/types/intelligence";
import type { HospitalPredictionMetrics } from "./predictions.server";

export async function getPredictions(
  hospitalId: string,
  sessionId?: string
): Promise<Prediction[]> {
  const url = new URL(`/api/hospitals/${hospitalId}/predictions`, window.location.origin);
  if (sessionId) {
    url.searchParams.set("sessionId", sessionId);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch predictions");
  }
  const json = await res.json();
  return json.data;
}

export async function getPredictionMetrics(
  hospitalId: string
): Promise<HospitalPredictionMetrics> {
  const res = await fetch(`/api/hospitals/${hospitalId}/predictions/stats`, {
    cache: "no-store",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch prediction metrics");
  }
  const json = await res.json();
  return json.data;
}

export async function recalculatePredictions(
  hospitalId: string,
  sessionId: string
): Promise<Prediction[]> {
  const res = await fetch(`/api/hospitals/${hospitalId}/predictions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to recalculate predictions");
  }
  const json = await res.json();
  return json.data;
}
