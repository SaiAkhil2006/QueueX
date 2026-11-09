import type { Recommendation } from "@/types/intelligence";
import type { DepartmentWorkload } from "./optimization.server";

export async function getRecommendations(
  hospitalId: string,
  filter?: { departmentId?: string; status?: string }
): Promise<Recommendation[]> {
  const url = new URL(`/api/hospitals/${hospitalId}/recommendations`, window.location.origin);
  if (filter?.departmentId) url.searchParams.set("departmentId", filter.departmentId);
  if (filter?.status) url.searchParams.set("status", filter.status);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch recommendations");
  }
  const json = await res.json();
  return json.data;
}

export async function generateRecommendations(
  hospitalId: string,
  departmentId?: string
): Promise<Recommendation[]> {
  const res = await fetch(`/api/hospitals/${hospitalId}/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ departmentId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to generate recommendations");
  }
  const json = await res.json();
  return json.data;
}

export async function applyRecommendation(
  hospitalId: string,
  recommendationId: string
): Promise<Recommendation> {
  const res = await fetch(
    `/api/hospitals/${hospitalId}/recommendations/${recommendationId}/apply`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to apply recommendation");
  }
  const json = await res.json();
  return json.data;
}

export async function dismissRecommendation(
  hospitalId: string,
  recommendationId: string
): Promise<Recommendation> {
  const res = await fetch(
    `/api/hospitals/${hospitalId}/recommendations/${recommendationId}/dismiss`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to dismiss recommendation");
  }
  const json = await res.json();
  return json.data;
}

export async function getDepartmentWorkload(
  hospitalId: string,
  departmentId: string
): Promise<DepartmentWorkload> {
  const url = new URL(
    `/api/hospitals/${hospitalId}/recommendations/workload`,
    window.location.origin
  );
  url.searchParams.set("departmentId", departmentId);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch department workload");
  }
  const json = await res.json();
  return json.data;
}
