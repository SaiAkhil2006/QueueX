import type {
  QueueEntry,
  LiveSessionQueueState,
  CompleteConsultationPayload,
  QueuePriority,
} from "../types";

export async function fetchSessionQueueState(
  hospitalId: string,
  sessionId: string
): Promise<LiveSessionQueueState> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/state?sessionId=${sessionId}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to fetch session queue state");
  }
  const data = await res.json();
  return data.state;
}

export async function createQueueEntryClient(
  hospitalId: string,
  input: {
    sessionId: string;
    patientId: string;
    appointmentId?: string | null;
    priority?: QueuePriority;
    source?: "walk_in" | "appointment" | "emergency";
    notes?: string | null;
  }
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/entries`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to issue queue token");
  }

  const data = await res.json();
  return data.entry;
}

export async function callNextPatientClient(
  hospitalId: string,
  sessionId: string
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/call-next?sessionId=${sessionId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to call next patient");
  }

  const data = await res.json();
  return data.entry;
}

export async function startConsultationClient(
  hospitalId: string,
  entryId: string
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/entries/${entryId}/start`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to start consultation");
  }

  const data = await res.json();
  return data.entry;
}

export async function completeConsultationClient(
  hospitalId: string,
  entryId: string,
  payload: CompleteConsultationPayload
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/entries/${entryId}/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to complete consultation");
  }

  const data = await res.json();
  return data.entry;
}

export async function skipPatientClient(
  hospitalId: string,
  entryId: string
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/entries/${entryId}/skip`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to skip patient");
  }

  const data = await res.json();
  return data.entry;
}

export async function recallPatientClient(
  hospitalId: string,
  entryId: string
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/entries/${entryId}/recall`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to recall patient");
  }

  const data = await res.json();
  return data.entry;
}

export async function updateQueuePriorityClient(
  hospitalId: string,
  entryId: string,
  priority: QueuePriority
): Promise<QueueEntry> {
  const res = await fetch(`/api/hospitals/${hospitalId}/queue/entries/${entryId}/priority`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priority }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update priority");
  }

  const data = await res.json();
  return data.entry;
}
