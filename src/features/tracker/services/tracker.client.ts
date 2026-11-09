import type { PatientTrackingInfo } from "./tracker.server";

export async function fetchPatientTracking(
  tokenDisplay: string,
  hospitalId = "hosp-vzg-001"
): Promise<PatientTrackingInfo> {
  const url = new URL("/api/patients/track", window.location.origin);
  url.searchParams.set("tokenDisplay", tokenDisplay.trim().toUpperCase());
  url.searchParams.set("hospitalId", hospitalId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Token not found");
  }
  const json = await res.json();
  return json.data;
}
