import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { serializeTimestamps } from "@/lib/firebase/timestamps";
import { nowTimestamp } from "@/lib/firebase/server-timestamps";
import {
  opdSessionSchema,
  createOPDSessionSchema,
  updateOPDSessionSchema,
  doctorScheduleSchema,
} from "@/schemas/scheduling.schema";
import { departmentSchema } from "@/schemas/department.schema";
import { doctorSchema } from "@/schemas/doctor.schema";
import { operationalEventSchema } from "@/schemas/operations.schema";
import type {
  SerializedOPDSession,
  SerializedOperationalEvent,
  SessionFilters,
  SessionTransitionInput,
} from "../types";
import {
  getTodayDateString,
  getDayOfWeekFromDateString,
  areTimeRangesOverlapping,
} from "../utils/session-dates";
import { z } from "zod";

export type CreateSessionInput = z.input<typeof createOPDSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateOPDSessionSchema>;

/**
 * Retrieves all OPD sessions for a hospital with optional filtering.
 */
export async function getSessionsByHospital(
  hospitalId: string,
  filters?: SessionFilters
): Promise<SerializedOPDSession[]> {
  const db = getAdminFirestore();
  const snapshot = await db.collection(paths.sessions(hospitalId)).get();

  const sessions: SerializedOPDSession[] = [];
  const todayStr = getTodayDateString();

  for (const doc of snapshot.docs) {
    try {
      const parsed = opdSessionSchema.parse({
        id: doc.id,
        ...doc.data(),
      });

      const serialized = serializeTimestamps(parsed) as SerializedOPDSession;

      if (filters?.doctorId && serialized.doctorId !== filters.doctorId) {
        continue;
      }
      if (
        filters?.departmentId &&
        serialized.departmentId !== filters.departmentId
      ) {
        continue;
      }
      if (
        filters?.status &&
        filters.status !== "all" &&
        serialized.status !== filters.status
      ) {
        continue;
      }
      if (filters?.date && serialized.date !== filters.date) {
        continue;
      }

      if (filters?.view) {
        if (filters.view === "today" && serialized.date !== todayStr) {
          continue;
        }
        if (filters.view === "upcoming" && serialized.date < todayStr) {
          continue;
        }
        if (filters.view === "past" && serialized.date >= todayStr) {
          continue;
        }
      }

      sessions.push(serialized);
    } catch {
      // Ignore unparseable documents
    }
  }

  // Sort: date descending, then startTime ascending
  return sessions.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return a.startTime.localeCompare(b.startTime);
  });
}

/**
 * Retrieves a single OPD session by ID.
 */
export async function getSessionById(
  hospitalId: string,
  sessionId: string
): Promise<SerializedOPDSession | null> {
  const db = getAdminFirestore();
  const docRef = db.doc(paths.session(hospitalId, sessionId));
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  try {
    const parsed = opdSessionSchema.parse({
      id: docSnap.id,
      ...docSnap.data(),
    });
    return serializeTimestamps(parsed) as SerializedOPDSession;
  } catch {
    return null;
  }
}

/**
 * Creates a new OPD operating session with full referential and business rule validation.
 */
export async function createSession(
  hospitalId: string,
  input: CreateSessionInput
): Promise<SerializedOPDSession> {
  const validated = createOPDSessionSchema.parse({
    ...input,
    hospitalId: input.hospitalId || hospitalId,
  });
  const db = getAdminFirestore();

  // 1. Validate department
  const deptRef = db.doc(paths.department(hospitalId, validated.departmentId));
  const deptSnap = await deptRef.get();
  if (!deptSnap.exists) {
    throw new Error(`Department '${validated.departmentId}' not found`);
  }
  const deptData = departmentSchema.parse({
    id: deptSnap.id,
    ...deptSnap.data(),
  });
  if (deptData.status !== "active") {
    throw new Error(`Department '${deptData.name}' is inactive or suspended`);
  }

  // 2. Validate doctor
  const docRef = db.doc(paths.doctor(hospitalId, validated.doctorId));
  const docSnap = await docRef.get();
  if (!docSnap.exists) {
    throw new Error(`Doctor '${validated.doctorId}' not found`);
  }
  const docData = doctorSchema.parse({ id: docSnap.id, ...docSnap.data() });
  if (docData.status !== "active") {
    throw new Error(`Doctor '${docData.name}' is not currently active`);
  }

  // 3. Validate doctor is assigned to selected department
  if (docData.departmentId !== validated.departmentId) {
    throw new Error(
      `Doctor '${docData.name}' belongs to department '${docData.departmentId}', not '${validated.departmentId}'`
    );
  }

  // 4. Validate doctor schedule compatibility
  const schedulesSnap = await db
    .collection(paths.schedules(hospitalId))
    .where("doctorId", "==", validated.doctorId)
    .get();

  if (!schedulesSnap.empty) {
    const schedDoc = schedulesSnap.docs[0];
    const schedData = doctorScheduleSchema.parse({
      id: schedDoc.id,
      ...schedDoc.data(),
    });

    if (!schedData.isActive) {
      throw new Error(`Doctor '${docData.name}' has an inactive schedule`);
    }

    const dayOfWeek = getDayOfWeekFromDateString(validated.date);
    if (!schedData.workingDays.includes(dayOfWeek)) {
      throw new Error(
        `Doctor '${docData.name}' is not scheduled to work on this day of week (${dayOfWeek})`
      );
    }
  }

  // 5. Prevent overlapping active or scheduled sessions for the same doctor
  const existingSessionsSnap = await db
    .collection(paths.sessions(hospitalId))
    .where("doctorId", "==", validated.doctorId)
    .where("date", "==", validated.date)
    .get();

  for (const doc of existingSessionsSnap.docs) {
    const data = doc.data();
    if (data.status !== "cancelled") {
      if (
        areTimeRangesOverlapping(
          validated.startTime,
          validated.endTime,
          data.startTime,
          data.endTime
        )
      ) {
        throw new Error(
          `Doctor '${docData.name}' already has a session (${doc.id}) scheduled during ${data.startTime}-${data.endTime}`
        );
      }
    }
  }

  // Generate ID if not provided
  const sessionId =
    validated.id ||
    `ses-${validated.doctorId}-${validated.date.replace(/-/g, "")}-${validated.startTime.replace(":", "")}`;

  const now = nowTimestamp();

  const sessionDocData = {
    id: sessionId,
    hospitalId,
    departmentId: validated.departmentId,
    departmentName: validated.departmentName || deptData.name,
    doctorId: validated.doctorId,
    doctorName: validated.doctorName || docData.name,
    roomNumber: validated.roomNumber || docData.roomNumber,
    date: validated.date,
    startTime: validated.startTime,
    endTime: validated.endTime,
    status: validated.status || "scheduled",
    currentRunningToken: null,
    totalTokensIssued: validated.totalTokensIssued ?? 0,
    completedCount: validated.completedCount ?? 0,
    waitingCount: validated.waitingCount ?? 0,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const targetRef = db.doc(paths.session(hospitalId, sessionId));
  await targetRef.set(sessionDocData);

  return serializeTimestamps(sessionDocData) as SerializedOPDSession;
}

/**
 * Updates an existing OPD session.
 */
export async function updateSession(
  hospitalId: string,
  sessionId: string,
  updates: UpdateSessionInput
): Promise<SerializedOPDSession> {
  const validated = updateOPDSessionSchema.parse(updates);
  const db = getAdminFirestore();
  const sessionRef = db.doc(paths.session(hospitalId, sessionId));
  const docSnap = await sessionRef.get();

  if (!docSnap.exists) {
    throw new Error(`OPD Session '${sessionId}' not found`);
  }

  const now = nowTimestamp();
  const updateData: Record<string, unknown> = {
    ...validated,
    updatedAt: now,
  };

  await sessionRef.update(updateData);

  const updatedSnap = await sessionRef.get();
  const parsed = opdSessionSchema.parse({
    id: updatedSnap.id,
    ...updatedSnap.data(),
  });

  return serializeTimestamps(parsed) as SerializedOPDSession;
}

/**
 * Executes an atomic OPD session state transition with strict validation
 * and persists the corresponding Operational Event in a Firestore transaction.
 */
export async function transitionSession(
  hospitalId: string,
  sessionId: string,
  transition: SessionTransitionInput
): Promise<{ session: SerializedOPDSession; eventId: string }> {
  const db = getAdminFirestore();
  const sessionRef = db.doc(paths.session(hospitalId, sessionId));
  const eventRef = db.collection(paths.operationalEvents(hospitalId)).doc();
  const eventId = eventRef.id;

  const now = nowTimestamp();

  return await db.runTransaction(async (transaction) => {
    const docSnap = await transaction.get(sessionRef);
    if (!docSnap.exists) {
      throw new Error(`OPD Session '${sessionId}' not found`);
    }

    const current = opdSessionSchema.parse({
      id: docSnap.id,
      ...docSnap.data(),
    });

    const action = transition.action;
    let nextStatus: typeof current.status;
    let eventType:
      | "session_started"
      | "session_paused"
      | "session_resumed"
      | "session_completed"
      | "session_cancelled";

    switch (action) {
      case "start":
        if (current.status !== "scheduled") {
          throw new Error(
            `Cannot start session: current status is '${current.status}' (expected 'scheduled')`
          );
        }
        nextStatus = "active";
        eventType = "session_started";
        break;

      case "pause":
        if (current.status !== "active") {
          throw new Error(
            `Cannot pause session: current status is '${current.status}' (expected 'active')`
          );
        }
        nextStatus = "paused";
        eventType = "session_paused";
        break;

      case "resume":
        if (current.status !== "paused") {
          throw new Error(
            `Cannot resume session: current status is '${current.status}' (expected 'paused')`
          );
        }
        nextStatus = "active";
        eventType = "session_resumed";
        break;

      case "complete":
        if (current.status !== "active" && current.status !== "paused") {
          throw new Error(
            `Cannot complete session: current status is '${current.status}' (expected 'active' or 'paused')`
          );
        }
        nextStatus = "completed";
        eventType = "session_completed";
        break;

      case "cancel":
        if (current.status !== "scheduled" && current.status !== "paused") {
          throw new Error(
            `Cannot cancel session: current status is '${current.status}' (expected 'scheduled' or 'paused')`
          );
        }
        nextStatus = "cancelled";
        eventType = "session_cancelled";
        break;

      default:
        throw new Error(`Unsupported transition action '${action}'`);
    }

    // Business Rule: Prevent overlapping active sessions for the same doctor
    if (nextStatus === "active") {
      const activeSessionsSnap = await transaction.get(
        db
          .collection(paths.sessions(hospitalId))
          .where("doctorId", "==", current.doctorId)
          .where("status", "==", "active")
      );

      for (const activeDoc of activeSessionsSnap.docs) {
        if (activeDoc.id !== sessionId) {
          throw new Error(
            `Doctor '${current.doctorName}' already has an active OPD session ('${activeDoc.id}')`
          );
        }
      }
    }

    // Prepare session updates
    const sessionUpdates: Record<string, unknown> = {
      status: nextStatus,
      updatedAt: now,
    };

    if (action === "start" && !current.startedAt) {
      sessionUpdates.startedAt = now;
    }
    if (action === "complete") {
      sessionUpdates.completedAt = now;
    }

    // Prepare Operational Event document
    const operationalEventData = {
      id: eventId,
      hospitalId,
      departmentId: current.departmentId,
      doctorId: current.doctorId,
      sessionId: current.id,
      eventType,
      severity: "info",
      timestamp: now,
      actorId: transition.actorId || null,
      actorRole: transition.actorRole || "system",
      description: `Doctor ${current.doctorName} OPD Session ${action}ed (${current.status} → ${nextStatus}) in Room ${current.roomNumber}`,
      metadata: {
        previousStatus: current.status,
        newStatus: nextStatus,
        reason: transition.reason || null,
        ...(transition.metadata || {}),
      },
    };

    transaction.update(sessionRef, sessionUpdates);
    transaction.set(eventRef, operationalEventData);

    const serializedCurrent = serializeTimestamps(current) as SerializedOPDSession;
    const updatedSession: SerializedOPDSession = {
      ...serializedCurrent,
      status: nextStatus,
      startedAt:
        action === "start"
          ? new Date().toISOString()
          : serializedCurrent.startedAt,
      completedAt:
        action === "complete"
          ? new Date().toISOString()
          : serializedCurrent.completedAt,
      updatedAt: new Date().toISOString(),
    };

    return {
      session: updatedSession,
      eventId,
    };
  });
}

/**
 * Retrieves recent operational events for a hospital or a specific session.
 */
export async function getOperationalEvents(
  hospitalId: string,
  options?: { sessionId?: string; limit?: number }
): Promise<SerializedOperationalEvent[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection(
    paths.operationalEvents(hospitalId)
  );

  if (options?.sessionId) {
    query = query.where("sessionId", "==", options.sessionId);
  }

  // Fetch documents and sort in memory by timestamp desc
  const snapshot = await query.get();
  const events: SerializedOperationalEvent[] = [];

  for (const doc of snapshot.docs) {
    try {
      const parsed = operationalEventSchema.parse({
        id: doc.id,
        ...doc.data(),
      });
      events.push(serializeTimestamps(parsed) as SerializedOperationalEvent);
    } catch {
      // Skip invalid events
    }
  }

  events.sort((a, b) => {
    const tA = new Date(String(a.timestamp)).getTime();
    const tB = new Date(String(b.timestamp)).getTime();
    return tB - tA;
  });

  return events.slice(0, options?.limit || 50);
}
