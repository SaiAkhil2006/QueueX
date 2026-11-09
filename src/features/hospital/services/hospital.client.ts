import type { SerializedHospital, HospitalFormValues } from "../types";
import type { ApiResponse } from "@/types/common";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

/**
 * Fetches the active hospital configuration from the API.
 */
export async function fetchHospital(
  hospitalId: string = DEFAULT_HOSPITAL_ID
): Promise<SerializedHospital> {
  const res = await fetch(`/api/hospitals/${hospitalId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as ApiResponse;
    throw new Error(errorData.error || `Failed to fetch hospital (${res.status})`);
  }

  const json = (await res.json()) as ApiResponse<SerializedHospital>;
  if (!json.data) {
    throw new Error("Hospital record not returned by server");
  }

  return json.data;
}

/**
 * Updates hospital configuration via the API.
 */
export async function updateHospital(
  hospitalId: string,
  formValues: Partial<HospitalFormValues>
): Promise<SerializedHospital> {
  // Map form values to the structured update payload matching updateHospitalSchema
  const payload: Record<string, unknown> = {};

  if (formValues.name !== undefined) payload.name = formValues.name;
  if (formValues.code !== undefined) payload.code = formValues.code;
  if (formValues.description !== undefined) payload.description = formValues.description;
  if (formValues.address !== undefined) payload.address = formValues.address;
  if (formValues.city !== undefined) payload.city = formValues.city;
  if (formValues.state !== undefined) payload.state = formValues.state;
  if (formValues.postalCode !== undefined) payload.postalCode = formValues.postalCode;
  if (formValues.timezone !== undefined) payload.timezone = formValues.timezone;
  if (formValues.phone !== undefined) payload.phone = formValues.phone;
  if (formValues.email !== undefined) payload.email = formValues.email;
  if (formValues.status !== undefined) payload.status = formValues.status;

  const configuration: Record<string, unknown> = {};
  if (formValues.opdMorningStartTime !== undefined)
    configuration.opdMorningStartTime = formValues.opdMorningStartTime;
  if (formValues.opdMorningEndTime !== undefined)
    configuration.opdMorningEndTime = formValues.opdMorningEndTime;
  if (formValues.opdEveningStartTime !== undefined)
    configuration.opdEveningStartTime = formValues.opdEveningStartTime;
  if (formValues.opdEveningEndTime !== undefined)
    configuration.opdEveningEndTime = formValues.opdEveningEndTime;
  if (formValues.emergencyWaitThresholdMinutes !== undefined)
    configuration.emergencyWaitThresholdMinutes = Number(formValues.emergencyWaitThresholdMinutes);
  if (formValues.maxActiveQueuesPerDoctor !== undefined)
    configuration.maxActiveQueuesPerDoctor = Number(formValues.maxActiveQueuesPerDoctor);
  if (formValues.autoCallNextEnabled !== undefined)
    configuration.autoCallNextEnabled = Boolean(formValues.autoCallNextEnabled);
  if (formValues.operatingDays !== undefined)
    configuration.operatingDays = formValues.operatingDays;

  if (Object.keys(configuration).length > 0) {
    payload.configuration = configuration;
  }

  const res = await fetch(`/api/hospitals/${hospitalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = (await res.json().catch(() => ({}))) as ApiResponse;
    throw new Error(errorData.error || `Failed to update hospital (${res.status})`);
  }

  const json = (await res.json()) as ApiResponse<SerializedHospital>;
  if (!json.data) {
    throw new Error("Updated hospital not returned by server");
  }

  return json.data;
}
