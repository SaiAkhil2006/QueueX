import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import { toDate } from "@/lib/firebase/timestamps";
import type {
  QueueEntry,
  LiveSessionQueueState,
  QueueEntryWithPosition,
  CompleteConsultationPayload,
  QueuePriority,
} from "../types";
import type { OPDSession } from "@/types/scheduling";
import type { Patient } from "@/types/patient";
import type { Department } from "@/types/department";
import type { Consultation } from "@/types/consultation";

const PRIORITY_ORDER: Record<QueuePriority, number> = {
  emergency: 1,
  priority: 2,
  normal: 3,
};

export function getTimestampMillis(val: unknown): number {
  if (!val) return 0;
  if (typeof (val as { toMillis?: () => number }).toMillis === "function") {
    return (val as { toMillis: () => number }).toMillis();
  }
  const d = toDate(val as Parameters<typeof toDate>[0]);
  return d ? d.getTime() : 0;
}

/**
 * Deterministically sort waiting queue entries by priority and arrival order.
 */
export function sortWaitingQueue(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    const rankA = PRIORITY_ORDER[a.priority] ?? 3;
    const rankB = PRIORITY_ORDER[b.priority] ?? 3;
    if (rankA !== rankB) {
      return rankA - rankB;
    }
    const timeA = getTimestampMillis(a.arrivalTime);
    const timeB = getTimestampMillis(b.arrivalTime);
    return timeA - timeB;
  });
}

/**
 * Retrieve aggregated live queue state for a specific OPD session.
 */
export async function getSessionQueueState(
  hospitalId: string,
  sessionId: string
): Promise<LiveSessionQueueState> {
  const db = getAdminFirestore();

  // 1. Fetch Session
  const sessionSnap = await db.doc(paths.session(hospitalId, sessionId)).get();
  const session = sessionSnap.exists ? (sessionSnap.data() as OPDSession) : null;

  // 2. Fetch all Queue Entries for this session
  const entriesSnap = await db
    .collection(paths.queueEntries(hospitalId))
    .where("sessionId", "==", sessionId)
    .get();

  const allEntries = entriesSnap.docs.map((d) => d.data() as QueueEntry);

  const currentlyInConsultation =
    allEntries.find((e) => e.status === "in_consultation") || null;
  const currentlyCalled =
    allEntries.find((e) => e.status === "called") || null;

  const rawWaiting = allEntries.filter((e) => e.status === "waiting");
  const sortedWaiting = sortWaitingQueue(rawWaiting);

  const skippedQueue = allEntries.filter((e) => e.status === "skipped");
  const recentCompleted = allEntries
    .filter((e) => e.status === "completed")
    .sort((a, b) => {
      const aDone = toDate(a.consultationCompletedAt)?.getTime() || 0;
      const bDone = toDate(b.consultationCompletedAt)?.getTime() || 0;
      return bDone - aDone;
    })
    .slice(0, 10);

  // 3. Calculate waiting positions and estimated waiting times
  const avgDurationMinutes = 15;
  let remainingCurrentMinutes = 0;

  if (currentlyInConsultation && currentlyInConsultation.consultationStartedAt) {
    const started = toDate(currentlyInConsultation.consultationStartedAt)?.getTime() || Date.now();
    const elapsedMinutes = Math.floor((Date.now() - started) / 60000);
    remainingCurrentMinutes = Math.max(1, avgDurationMinutes - elapsedMinutes);
  }

  const waitingQueue: QueueEntryWithPosition[] = sortedWaiting.map((entry, index) => {
    const position = index + 1;
    const wait = remainingCurrentMinutes + index * avgDurationMinutes;
    return {
      ...entry,
      position,
      calculatedWaitMinutes: wait,
    };
  });

  return {
    session,
    currentlyInConsultation,
    currentlyCalled,
    waitingQueue,
    skippedQueue,
    recentCompleted,
    stats: {
      totalTokens: allEntries.length,
      waitingCount: waitingQueue.length,
      completedCount: allEntries.filter((e) => e.status === "completed").length,
      avgWaitMinutes: avgDurationMinutes,
    },
  };
}

/**
 * Register a patient into an active OPD queue session, issuing a unique digital token.
 */
export async function createQueueEntry(
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
  const db = getAdminFirestore();

  // 1. Fetch Session
  const sessionSnap = await db.doc(paths.session(hospitalId, input.sessionId)).get();
  if (!sessionSnap.exists) {
    throw new Error(`OPD Session '${input.sessionId}' not found.`);
  }
  const session = sessionSnap.data() as OPDSession;

  // 2. Fetch Patient
  const patientSnap = await db.doc(paths.patient(hospitalId, input.patientId)).get();
  if (!patientSnap.exists) {
    throw new Error(`Patient '${input.patientId}' not found.`);
  }
  const patient = patientSnap.data() as Patient;

  // 3. Fetch Department code for token display
  const deptSnap = await db.doc(paths.department(hospitalId, session.departmentId)).get();
  const deptCode = deptSnap.exists ? (deptSnap.data() as Department).code : "OPD";

  // 4. Duplicate Active Queue Prevention
  const existingActive = await db
    .collection(paths.queueEntries(hospitalId))
    .where("sessionId", "==", input.sessionId)
    .where("patientId", "==", input.patientId)
    .get();

  const hasActive = existingActive.docs.some((doc) => {
    const s = doc.data().status;
    return s === "waiting" || s === "called" || s === "in_consultation";
  });

  if (hasActive) {
    throw new Error(
      `Patient '${patient.name}' already has an active token in this OPD session.`
    );
  }

  // 5. Generate token number sequentially in session
  const tokenNumber = (session.totalTokensIssued || 0) + 1;
  const tokenDisplay = `${deptCode}-${String(tokenNumber).padStart(3, "0")}`;

  const entryId = `qent-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const now = nowTimestamp();

  const queueEntryRecord: Record<string, unknown> = {
    id: entryId,
    hospitalId,
    departmentId: session.departmentId,
    departmentName: session.departmentName,
    doctorId: session.doctorId,
    doctorName: session.doctorName,
    sessionId: input.sessionId,
    patientId: input.patientId,
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    appointmentId: input.appointmentId ?? null,
    tokenNumber,
    tokenDisplay,
    source: input.source || (input.appointmentId ? "appointment" : "walk_in"),
    priority: input.priority || "normal",
    status: "waiting",
    arrivalTime: now,
    calledAt: null,
    consultationStartedAt: null,
    consultationCompletedAt: null,
    estimatedWaitMinutes: 15,
    notes: input.notes ?? null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  const entryRef = db.doc(paths.queueEntry(hospitalId, entryId));
  batch.set(entryRef, queueEntryRecord);

  // Update session counters
  const sessionRef = db.doc(paths.session(hospitalId, input.sessionId));
  batch.update(sessionRef, {
    totalTokensIssued: tokenNumber,
    waitingCount: (session.waitingCount || 0) + 1,
    updatedAt: now,
  });

  // If appointment linked, update appointment to checked_in with token number
  if (input.appointmentId) {
    const aptRef = db.doc(paths.appointment(hospitalId, input.appointmentId));
    batch.update(aptRef, {
      status: "checked_in",
      tokenNumber,
      queueEntryId: entryId,
      updatedAt: now,
    });
  }

  // Operational event
  const eventId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const eventRef = db.doc(paths.operationalEvent(hospitalId, eventId));
  batch.set(eventRef, {
    id: eventId,
    hospitalId,
    departmentId: session.departmentId,
    doctorId: session.doctorId,
    sessionId: input.sessionId,
    queueEntryId: entryId,
    eventType: input.priority === "emergency" ? "emergency_patient_added" : "consultation_started",
    severity: input.priority === "emergency" ? "critical" : "info",
    timestamp: now,
    actorRole: "staff",
    description: `Token ${tokenDisplay} issued for ${patient.name} (${input.priority || "normal"} priority)`,
    metadata: { tokenNumber, tokenDisplay, priority: input.priority || "normal" },
  });

  await batch.commit();
  const createdSnap = await entryRef.get();
  return createdSnap.data() as QueueEntry;
}

/**
 * Call the next waiting patient according to deterministic priority queue order.
 */
export async function callNextPatient(
  hospitalId: string,
  sessionId: string
): Promise<QueueEntry> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    // 1. Fetch Session
    const sessionRef = db.doc(paths.session(hospitalId, sessionId));
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new Error(`OPD Session '${sessionId}' not found.`);
    }
    const session = sessionSnap.data() as OPDSession;

    if (session.status === "paused") {
      throw new Error("Cannot call patient while OPD session is paused.");
    }
    if (session.status === "completed" || session.status === "cancelled") {
      throw new Error(`Cannot call patient in a ${session.status} session.`);
    }

    // 2. Query all waiting entries for this session
    const entriesSnap = await transaction.get(
      db
        .collection(paths.queueEntries(hospitalId))
        .where("sessionId", "==", sessionId)
        .where("status", "==", "waiting")
    );

    const waiting = entriesSnap.docs.map((d) => d.data() as QueueEntry);
    if (waiting.length === 0) {
      throw new Error("No waiting patients in this session queue.");
    }

    const sorted = sortWaitingQueue(waiting);
    const nextPatient = sorted[0];

    const now = nowTimestamp();
    const entryRef = db.doc(paths.queueEntry(hospitalId, nextPatient.id));

    transaction.update(entryRef, {
      status: "called",
      calledAt: now,
      updatedAt: now,
    });

    transaction.update(sessionRef, {
      currentRunningToken: nextPatient.tokenNumber,
      waitingCount: Math.max(0, (session.waitingCount || 1) - 1),
      updatedAt: now,
    });

    return {
      ...nextPatient,
      status: "called" as const,
      calledAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Start clinical consultation for a called or waiting queue entry.
 */
export async function startConsultation(
  hospitalId: string,
  entryId: string
): Promise<QueueEntry> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const entryRef = db.doc(paths.queueEntry(hospitalId, entryId));
    const entrySnap = await transaction.get(entryRef);
    if (!entrySnap.exists) {
      throw new Error(`Queue entry '${entryId}' not found.`);
    }
    const entry = entrySnap.data() as QueueEntry;

    if (entry.status !== "called" && entry.status !== "waiting") {
      throw new Error(`Cannot start consultation for patient with status '${entry.status}'.`);
    }

    // Ensure NO OTHER patient is currently in_consultation for this doctor/session
    const inConsultSnap = await transaction.get(
      db
        .collection(paths.queueEntries(hospitalId))
        .where("sessionId", "==", entry.sessionId)
        .where("status", "==", "in_consultation")
    );

    if (!inConsultSnap.empty) {
      const activeEntry = inConsultSnap.docs[0].data() as QueueEntry;
      throw new Error(
        `Doctor already has an active consultation in progress (Token ${activeEntry.tokenDisplay}). Complete or suspend it first.`
      );
    }

    const now = nowTimestamp();

    transaction.update(entryRef, {
      status: "in_consultation",
      consultationStartedAt: now,
      updatedAt: now,
    });

    return {
      ...entry,
      status: "in_consultation" as const,
      consultationStartedAt: now,
      updatedAt: now,
    };
  });
}

/**
 * Complete a consultation, creating an immutable Consultation document and updating session counters.
 */
export async function completeConsultation(
  hospitalId: string,
  entryId: string,
  payload: CompleteConsultationPayload
): Promise<{ entry: QueueEntry; consultation: Consultation }> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    // 1. ALL READS FIRST
    const entryRef = db.doc(paths.queueEntry(hospitalId, entryId));
    const entrySnap = await transaction.get(entryRef);
    if (!entrySnap.exists) {
      throw new Error(`Queue entry '${entryId}' not found.`);
    }
    const entry = entrySnap.data() as QueueEntry;

    if (entry.status !== "in_consultation") {
      throw new Error(`Cannot complete consultation: Entry status is '${entry.status}', expected 'in_consultation'.`);
    }

    const sessionRef = db.doc(paths.session(hospitalId, entry.sessionId));
    const sessionSnap = await transaction.get(sessionRef);

    const now = nowTimestamp();
    const started = toDate(entry.consultationStartedAt)?.getTime() || Date.now();
    const completed = now.toMillis();
    const durationSeconds = Math.max(60, Math.floor((completed - started) / 1000));

    // 2. ALL WRITES NEXT
    // Update QueueEntry
    transaction.update(entryRef, {
      status: "completed",
      consultationCompletedAt: now,
      notes: payload.notes || entry.notes,
      updatedAt: now,
    });

    // Create Immutable Consultation Record
    const consultId = `cst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const consultRef = db.doc(paths.consultation(hospitalId, consultId));

    const consultationRecord: Record<string, unknown> = {
      id: consultId,
      hospitalId,
      departmentId: entry.departmentId,
      departmentName: entry.departmentName,
      doctorId: entry.doctorId,
      doctorName: entry.doctorName,
      sessionId: entry.sessionId,
      queueEntryId: entry.id,
      patientId: entry.patientId,
      patientName: entry.patientName,
      tokenNumber: entry.tokenNumber,
      status: "completed",
      startedAt: entry.consultationStartedAt || now,
      completedAt: now,
      durationSeconds,
      outcome: payload.outcome || "routine_clear",
      delayReason: payload.delayReason ?? null,
      notes: payload.notes ?? null,
      createdAt: now,
    };

    transaction.set(consultRef, consultationRecord);

    // Update Session completedCount
    if (sessionSnap.exists) {
      const session = sessionSnap.data() as OPDSession;
      transaction.update(sessionRef, {
        completedCount: (session.completedCount || 0) + 1,
        updatedAt: now,
      });
    }

    // If appointment linked, mark as completed
    if (entry.appointmentId) {
      const aptRef = db.doc(paths.appointment(hospitalId, entry.appointmentId));
      transaction.update(aptRef, {
        status: "completed",
        updatedAt: now,
      });
    }

    // Record operational event
    const eventId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const eventRef = db.doc(paths.operationalEvent(hospitalId, eventId));
    transaction.set(eventRef, {
      id: eventId,
      hospitalId,
      departmentId: entry.departmentId,
      doctorId: entry.doctorId,
      sessionId: entry.sessionId,
      queueEntryId: entry.id,
      eventType: "consultation_completed",
      severity: "info",
      timestamp: now,
      actorRole: "doctor",
      description: `Consultation completed for Token ${entry.tokenDisplay} (${Math.round(durationSeconds / 60)} min) - ${payload.outcome}`,
      metadata: { durationSeconds, outcome: payload.outcome },
    });

    const updatedEntry: QueueEntry = {
      ...entry,
      status: "completed",
      consultationCompletedAt: now,
      notes: payload.notes || entry.notes,
      updatedAt: now,
    };

    return {
      entry: updatedEntry,
      consultation: consultationRecord as unknown as Consultation,
    };
  });
}

/**
 * Skip a called patient who did not respond.
 */
export async function skipPatient(
  hospitalId: string,
  entryId: string
): Promise<QueueEntry> {
  const db = getAdminFirestore();
  const entryRef = db.doc(paths.queueEntry(hospitalId, entryId));
  const entrySnap = await entryRef.get();
  if (!entrySnap.exists) {
    throw new Error(`Queue entry '${entryId}' not found.`);
  }
  const entry = entrySnap.data() as QueueEntry;

  const now = nowTimestamp();
  await entryRef.update({
    status: "skipped",
    updatedAt: now,
  });

  // Event
  const eventId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  await db.doc(paths.operationalEvent(hospitalId, eventId)).set({
    id: eventId,
    hospitalId,
    departmentId: entry.departmentId,
    doctorId: entry.doctorId,
    sessionId: entry.sessionId,
    queueEntryId: entry.id,
    eventType: "patient_skipped",
    severity: "warning",
    timestamp: now,
    actorRole: "staff",
    description: `Token ${entry.tokenDisplay} skipped (no response)`,
    metadata: { tokenDisplay: entry.tokenDisplay },
  });

  const updatedSnap = await entryRef.get();
  return updatedSnap.data() as QueueEntry;
}

/**
 * Recall a skipped patient back into the waiting line.
 */
export async function recallPatient(
  hospitalId: string,
  entryId: string
): Promise<QueueEntry> {
  const db = getAdminFirestore();
  const entryRef = db.doc(paths.queueEntry(hospitalId, entryId));
  const entrySnap = await entryRef.get();
  if (!entrySnap.exists) {
    throw new Error(`Queue entry '${entryId}' not found.`);
  }
  const entry = entrySnap.data() as QueueEntry;

  const now = nowTimestamp();
  await entryRef.update({
    status: "waiting",
    updatedAt: now,
  });

  // Update session waiting counter
  const sessionRef = db.doc(paths.session(hospitalId, entry.sessionId));
  const sessionSnap = await sessionRef.get();
  if (sessionSnap.exists) {
    const session = sessionSnap.data() as OPDSession;
    await sessionRef.update({
      waitingCount: (session.waitingCount || 0) + 1,
      updatedAt: now,
    });
  }

  const updatedSnap = await entryRef.get();
  return updatedSnap.data() as QueueEntry;
}

/**
 * Upgrade or change queue entry priority (e.g. emergency elevation).
 */
export async function updateQueuePriority(
  hospitalId: string,
  entryId: string,
  newPriority: QueuePriority,
  notes?: string
): Promise<QueueEntry> {
  const db = getAdminFirestore();
  const entryRef = db.doc(paths.queueEntry(hospitalId, entryId));
  const entrySnap = await entryRef.get();
  if (!entrySnap.exists) {
    throw new Error(`Queue entry '${entryId}' not found.`);
  }
  const entry = entrySnap.data() as QueueEntry;

  const now = nowTimestamp();
  const updateData: Record<string, unknown> = {
    priority: newPriority,
    updatedAt: now,
  };
  if (notes !== undefined) {
    updateData.notes = notes;
  }

  await entryRef.update(updateData);

  if (newPriority === "emergency") {
    const eventId = `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    await db.doc(paths.operationalEvent(hospitalId, eventId)).set({
      id: eventId,
      hospitalId,
      departmentId: entry.departmentId,
      doctorId: entry.doctorId,
      sessionId: entry.sessionId,
      queueEntryId: entry.id,
      eventType: "emergency_patient_added",
      severity: "critical",
      timestamp: now,
      actorRole: "staff",
      description: `Token ${entry.tokenDisplay} elevated to EMERGENCY priority`,
      metadata: { tokenDisplay: entry.tokenDisplay },
    });
  }

  const updatedSnap = await entryRef.get();
  return updatedSnap.data() as QueueEntry;
}
