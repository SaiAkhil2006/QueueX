import type { DashboardData, DashboardApiResponse } from "../types";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

/**
 * Fetches staff operational dashboard data from the API endpoint.
 */
export async function fetchStaffDashboard(
  hospitalId: string = DEFAULT_HOSPITAL_ID
): Promise<DashboardData> {
  const url = `/api/hospitals/${hospitalId}/dashboard`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to fetch dashboard data (${res.status})`
    );
  }

  const json = (await res.json()) as DashboardApiResponse;

  if (!json.success || !json.data) {
    throw new Error(json.error || "Incomplete dashboard telemetry received");
  }

  return json.data;
}
