import type {
  SerializedOPDSession,
  SerializedOperationalEvent,
  SessionFilters,
  SessionTransitionAction,
  SessionApiResponse,
  SessionListApiResponse,
  OperationalEventsApiResponse,
  CreateSessionFormValues,
} from "../types";

const DEFAULT_HOSPITAL_ID = "hosp-vzg-001";

/**
 * Fetches OPD sessions for a hospital with optional filters.
 */
export async function fetchSessions(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  filters?: SessionFilters
): Promise<SerializedOPDSession[]> {
  const params = new URLSearchParams();
  if (filters?.doctorId) params.set("doctorId", filters.doctorId);
  if (filters?.departmentId) params.set("departmentId", filters.departmentId);
  if (filters?.status && filters.status !== "all")
    params.set("status", filters.status);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.view) params.set("view", filters.view);

  const qs = params.toString();
  const url = `/api/hospitals/${hospitalId}/sessions${qs ? `?${qs}` : ""}`;

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
      errorData.error || `Failed to fetch OPD sessions (${res.status})`
    );
  }

  const json = (await res.json()) as SessionListApiResponse;
  return json.data || [];
}

/**
 * Fetches a single OPD session by ID.
 */
export async function fetchSessionById(
  hospitalId: string,
  sessionId: string
): Promise<SerializedOPDSession | null> {
  const url = `/api/hospitals/${hospitalId}/sessions/${sessionId}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const errorData = (await res.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(
      errorData.error || `Failed to fetch session (${res.status})`
    );
  }

  const json = (await res.json()) as SessionApiResponse;
  return json.data || null;
}

/**
 * Creates a new OPD operating session.
 */
export async function createOPDSession(
  hospitalId: string,
  formData: CreateSessionFormValues
): Promise<SerializedOPDSession> {
  const url = `/api/hospitals/${hospitalId}/sessions`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...formData,
      hospitalId,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as SessionApiResponse;

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to create session (${res.status})`);
  }

  if (!json.data) {
    throw new Error("No session data returned after creation");
  }

  return json.data;
}

/**
 * Updates an OPD session's operational details.
 */
export async function updateOPDSession(
  hospitalId: string,
  sessionId: string,
  updates: Partial<SerializedOPDSession>
): Promise<SerializedOPDSession> {
  const url = `/api/hospitals/${hospitalId}/sessions/${sessionId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const json = (await res.json().catch(() => ({}))) as SessionApiResponse;

  if (!res.ok || !json.success) {
    throw new Error(json.error || `Failed to update session (${res.status})`);
  }

  if (!json.data) {
    throw new Error("No session data returned after update");
  }

  return json.data;
}

/**
 * Transitions an OPD session to a new state and logs an operational event.
 */
export async function transitionOPDSession(
  hospitalId: string,
  sessionId: string,
  action: SessionTransitionAction,
  options?: {
    actorId?: string;
    actorRole?: "doctor" | "nurse" | "admin" | "system";
    reason?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<{ session: SerializedOPDSession; eventId: string }> {
  const url = `/api/hospitals/${hospitalId}/sessions/${sessionId}/transition`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      ...options,
    }),
  });

  const json = (await res.json().catch(() => ({}))) as SessionApiResponse;

  if (!res.ok || !json.success) {
    throw new Error(
      json.error || `Failed to transition session state (${res.status})`
    );
  }

  if (!json.data || !json.eventId) {
    throw new Error("Incomplete transition response returned from server");
  }

  return { session: json.data, eventId: json.eventId };
}

/**
 * Fetches recent operational events for this hospital or specific session.
 */
export async function fetchOperationalEvents(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
  options?: { sessionId?: string; limit?: number }
): Promise<SerializedOperationalEvent[]> {
  const params = new URLSearchParams();
  if (options?.sessionId) params.set("sessionId", options.sessionId);
  if (options?.limit) params.set("limit", options.limit.toString());

  const qs = params.toString();
  const url = `/api/hospitals/${hospitalId}/events${qs ? `?${qs}` : ""}`;

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
      errorData.error || `Failed to fetch operational events (${res.status})`
    );
  }

  const json = (await res.json()) as OperationalEventsApiResponse;
  return json.data || [];
}
