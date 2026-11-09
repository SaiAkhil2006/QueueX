import type { HospitalAnalyticsSummary } from "../types";

export async function fetchHospitalAnalytics(
  hospitalId: string
): Promise<HospitalAnalyticsSummary> {
  const res = await fetch(`/api/hospitals/${hospitalId}/analytics`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch analytics");
  }

  const json = await res.json();
  return json.data;
}
