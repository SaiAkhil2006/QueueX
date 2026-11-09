import type {
  DepartmentWithStats,
  DepartmentFormValues,
  DepartmentApiResponse,
  DepartmentListApiResponse,
} from "../types";
import type { DepartmentStatus } from "@/types/department";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

/**
 * Fetches all departments for the hospital with assigned doctor counts.
 */
export async function fetchDepartments(
  hospitalId: string = DEFAULT_HOSPITAL_ID
): Promise<DepartmentWithStats[]> {
  const res = await fetch(`/api/hospitals/${hospitalId}/departments`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to fetch departments (${res.status})`
    );
  }

  const json = (await res.json()) as DepartmentListApiResponse;
  return json.data || [];
}

/**
 * Fetches a single department by ID.
 */
export async function fetchDepartment(
  hospitalId: string,
  departmentId: string
): Promise<DepartmentWithStats> {
  const res = await fetch(
    `/api/hospitals/${hospitalId}/departments/${departmentId}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to fetch department (${res.status})`
    );
  }

  const json = (await res.json()) as DepartmentApiResponse;
  if (!json.data) {
    throw new Error("Department not returned by server");
  }

  return json.data;
}

/**
 * Creates a new department.
 */
export async function createDepartment(
  hospitalId: string,
  formValues: DepartmentFormValues
): Promise<DepartmentWithStats> {
  const payload = {
    name: formValues.name.trim(),
    code: formValues.code.trim().toUpperCase(),
    description: formValues.description?.trim() || undefined,
    floor: formValues.floor?.trim() || undefined,
    buildingWing: formValues.buildingWing?.trim() || undefined,
    avgConsultationDurationMinutes: Number(
      formValues.avgConsultationDurationMinutes
    ),
    status: formValues.status,
  };

  const res = await fetch(`/api/hospitals/${hospitalId}/departments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to create department (${res.status})`
    );
  }

  const json = (await res.json()) as DepartmentApiResponse;
  if (!json.data) {
    throw new Error("Created department not returned by server");
  }

  return json.data;
}

/**
 * Updates an existing department.
 */
export async function updateDepartment(
  hospitalId: string,
  departmentId: string,
  formValues: Partial<DepartmentFormValues>
): Promise<DepartmentWithStats> {
  const payload: Record<string, unknown> = {};

  if (formValues.name !== undefined) payload.name = formValues.name.trim();
  if (formValues.code !== undefined)
    payload.code = formValues.code.trim().toUpperCase();
  if (formValues.description !== undefined)
    payload.description = formValues.description.trim() || undefined;
  if (formValues.floor !== undefined)
    payload.floor = formValues.floor.trim() || undefined;
  if (formValues.buildingWing !== undefined)
    payload.buildingWing = formValues.buildingWing.trim() || undefined;
  if (formValues.avgConsultationDurationMinutes !== undefined)
    payload.avgConsultationDurationMinutes = Number(
      formValues.avgConsultationDurationMinutes
    );
  if (formValues.status !== undefined) payload.status = formValues.status;

  const res = await fetch(
    `/api/hospitals/${hospitalId}/departments/${departmentId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to update department (${res.status})`
    );
  }

  const json = (await res.json()) as DepartmentApiResponse;
  if (!json.data) {
    throw new Error("Updated department not returned by server");
  }

  return json.data;
}

/**
 * Convenience method to toggle active/inactive status.
 */
export async function setDepartmentStatus(
  hospitalId: string,
  departmentId: string,
  status: DepartmentStatus
): Promise<DepartmentWithStats> {
  return updateDepartment(hospitalId, departmentId, { status });
}
