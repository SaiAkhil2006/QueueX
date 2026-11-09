import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  getSessionsByHospital,
  getSessionById,
  createSession,
  updateSession,
  transitionSession,
  getOperationalEvents,
} from "@/features/sessions/services/sessions.server";
import { createDoctor } from "@/features/doctors/services/doctors.server";
import { createOrUpdateDoctorSchedule } from "@/features/schedules/services/schedules.server";
import {
  GET as getSessionsRoute,
  POST as postSessionRoute,
} from "@/app/api/hospitals/[hospitalId]/sessions/route";
import {
  GET as getSingleSessionRoute,
  PATCH as patchSessionRoute,
} from "@/app/api/hospitals/[hospitalId]/sessions/[sessionId]/route";
import { POST as postTransitionRoute } from "@/app/api/hospitals/[hospitalId]/sessions/[sessionId]/transition/route";
import { GET as getEventsRoute } from "@/app/api/hospitals/[hospitalId]/events/route";
import { NextRequest } from "next/server";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";

describe("F1.5: OPD Operating Sessions & Operational Events", () => {
  const testDoctorId = `doc-test-sr-${Date.now().toString().slice(-6)}`;
  const testSessionId = `ses-test-${Date.now()}`;
  const testRouteSessionId = `ses-route-${Date.now()}`;
  const conflictSessionId = `ses-conflict-${Date.now()}`;
  const createdEventIds: string[] = [];

  const today = new Date();
  const testDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (testDate.getDay() === 0) {
    testDate.setDate(testDate.getDate() + 1);
  }
  const dateStr = testDate.toISOString().slice(0, 10);

  beforeAll(async () => {
    // Register a dedicated doctor without existing active sessions for lifecycle testing
    await createDoctor(SEED_HOSPITAL_ID, {
      id: testDoctorId,
      name: "Dr. Session Lifecycle Tester",
      departmentId: "dept-gm",
      qualification: "MBBS, MD",
      specialization: "Internal Medicine",
      roomNumber: "999",
      consultationDurationEstimate: 15,
      status: "active",
      availability: "available",
      phone: "+91 891 000 0000",
      email: "lifecycle.test@example.com",
    });

    await createOrUpdateDoctorSchedule(SEED_HOSPITAL_ID, testDoctorId, {
      startTime: "08:00",
      endTime: "18:00",
      maxPatientsPerSession: 40,
      workingDays: [0, 1, 2, 3, 4, 5, 6],
      breakPeriods: [],
      isActive: true,
    });
  });

  afterAll(async () => {
    const db = getAdminFirestore();
    await db.doc(paths.session(SEED_HOSPITAL_ID, testSessionId)).delete().catch(() => {});
    await db.doc(paths.session(SEED_HOSPITAL_ID, testRouteSessionId)).delete().catch(() => {});
    await db.doc(paths.session(SEED_HOSPITAL_ID, conflictSessionId)).delete().catch(() => {});
    await db.doc(paths.doctor(SEED_HOSPITAL_ID, testDoctorId)).delete().catch(() => {});
    await db.doc(paths.schedule(SEED_HOSPITAL_ID, `sch-${testDoctorId}`)).delete().catch(() => {});

    for (const eid of createdEventIds) {
      await db.doc(paths.operationalEvent(SEED_HOSPITAL_ID, eid)).delete().catch(() => {});
    }
  });

  describe("Server Service: getSessionsByHospital", () => {
    it("retrieves seeded sessions for the hospital", async () => {
      const sessions = await getSessionsByHospital(SEED_HOSPITAL_ID);
      expect(sessions.length).toBeGreaterThanOrEqual(1);
      const first = sessions[0];
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("doctorId");
      expect(first).toHaveProperty("departmentId");
      expect(first).toHaveProperty("status");
    });

    it("filters sessions by status", async () => {
      const activeSessions = await getSessionsByHospital(SEED_HOSPITAL_ID, {
        status: "active",
      });
      expect(activeSessions.every((s) => s.status === "active")).toBe(true);
    });

    it("filters sessions by departmentId", async () => {
      const gmSessions = await getSessionsByHospital(SEED_HOSPITAL_ID, {
        departmentId: "dept-gm",
      });
      expect(gmSessions.every((s) => s.departmentId === "dept-gm")).toBe(true);
    });

    it("filters sessions by doctorId", async () => {
      const docSessions = await getSessionsByHospital(SEED_HOSPITAL_ID, {
        doctorId: "doc-gm-01",
      });
      expect(docSessions.every((s) => s.doctorId === "doc-gm-01")).toBe(true);
    });
  });

  describe("Server Service: getSessionById", () => {
    it("returns null for non-existent session", async () => {
      const res = await getSessionById(SEED_HOSPITAL_ID, "non-existent-session-xyz");
      expect(res).toBeNull();
    });
  });

  describe("Server Service: createSession & Business Rules", () => {
    it("rejects session creation for non-existent department", async () => {
      await expect(
        createSession(SEED_HOSPITAL_ID, {
          departmentId: "dept-non-existent",
          doctorId: testDoctorId,
          roomNumber: "999",
          date: dateStr,
          startTime: "09:00",
          endTime: "13:00",
        })
      ).rejects.toThrow(/Department .* not found/);
    });

    it("rejects session creation for non-existent doctor", async () => {
      await expect(
        createSession(SEED_HOSPITAL_ID, {
          departmentId: "dept-gm",
          doctorId: "doc-non-existent",
          roomNumber: "101",
          date: dateStr,
          startTime: "09:00",
          endTime: "13:00",
        })
      ).rejects.toThrow(/Doctor .* not found/);
    });

    it("rejects doctor assigned to mismatched department", async () => {
      await expect(
        createSession(SEED_HOSPITAL_ID, {
          departmentId: "dept-cardio",
          doctorId: testDoctorId, // Belongs to dept-gm
          roomNumber: "999",
          date: dateStr,
          startTime: "09:00",
          endTime: "13:00",
        })
      ).rejects.toThrow(/belongs to department/);
    });

    it("successfully creates a valid OPD session", async () => {
      const created = await createSession(SEED_HOSPITAL_ID, {
        id: testSessionId,
        departmentId: "dept-gm",
        doctorId: testDoctorId,
        roomNumber: "999",
        date: dateStr,
        startTime: "09:00",
        endTime: "13:00",
      });

      expect(created.id).toBe(testSessionId);
      expect(created.doctorId).toBe(testDoctorId);
      expect(created.departmentId).toBe("dept-gm");
      expect(created.status).toBe("scheduled");
      expect(created.date).toBe(dateStr);
      expect(created.startTime).toBe("09:00");
      expect(created.endTime).toBe("13:00");
      expect(created.startedAt).toBeNull();
      expect(created.completedAt).toBeNull();
    });

    it("updates session details successfully via updateSession", async () => {
      const updated = await updateSession(SEED_HOSPITAL_ID, testSessionId, {
        roomNumber: "998",
      });
      expect(updated.roomNumber).toBe("998");
    });

    it("rejects overlapping session for the same doctor on the same date", async () => {
      await expect(
        createSession(SEED_HOSPITAL_ID, {
          departmentId: "dept-gm",
          doctorId: testDoctorId,
          roomNumber: "999",
          date: dateStr,
          startTime: "10:00",
          endTime: "14:00",
        })
      ).rejects.toThrow(/already has a session/);
    });
  });

  describe("Server Service: transitionSession Lifecycle & Operational Events", () => {
    it("enforces rule: prevents starting a session if doctor already has an active session", async () => {
      // Dr. Rajesh Varma already has an active morning session
      await createSession(SEED_HOSPITAL_ID, {
        id: conflictSessionId,
        departmentId: "dept-gm",
        doctorId: "doc-gm-01",
        roomNumber: "101",
        date: dateStr,
        startTime: "15:00",
        endTime: "18:00",
      });

      await expect(
        transitionSession(SEED_HOSPITAL_ID, conflictSessionId, {
          action: "start",
        })
      ).rejects.toThrow(/already has an active OPD session/);
    });

    it("starts a scheduled session: scheduled -> active, sets startedAt and logs SESSION_STARTED", async () => {
      const result = await transitionSession(SEED_HOSPITAL_ID, testSessionId, {
        action: "start",
        actorRole: "doctor",
        reason: "Doctor arrived at consultation room",
      });

      expect(result.session.status).toBe("active");
      expect(result.session.startedAt).toBeTruthy();
      expect(result.eventId).toBeTruthy();
      createdEventIds.push(result.eventId);

      const events = await getOperationalEvents(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
      });
      const startEvent = events.find((e) => e.eventType === "session_started");
      expect(startEvent).toBeDefined();
      expect(startEvent?.doctorId).toBe(testDoctorId);
      expect(startEvent?.departmentId).toBe("dept-gm");
      expect(startEvent?.actorRole).toBe("doctor");
      expect(startEvent?.metadata?.previousStatus).toBe("scheduled");
      expect(startEvent?.metadata?.newStatus).toBe("active");
    });

    it("rejects invalid transition: cannot start an already active session", async () => {
      await expect(
        transitionSession(SEED_HOSPITAL_ID, testSessionId, {
          action: "start",
        })
      ).rejects.toThrow(/Cannot start session: current status is 'active'/);
    });

    it("pauses an active session: active -> paused, logs SESSION_PAUSED", async () => {
      const result = await transitionSession(SEED_HOSPITAL_ID, testSessionId, {
        action: "pause",
        actorRole: "nurse",
        reason: "Doctor stepped out for emergency consult",
      });

      expect(result.session.status).toBe("paused");
      expect(result.eventId).toBeTruthy();
      createdEventIds.push(result.eventId);

      const events = await getOperationalEvents(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
      });
      const pauseEvent = events.find((e) => e.eventType === "session_paused");
      expect(pauseEvent).toBeDefined();
      expect(pauseEvent?.metadata?.newStatus).toBe("paused");
    });

    it("rejects invalid transition: cannot pause an already paused session", async () => {
      await expect(
        transitionSession(SEED_HOSPITAL_ID, testSessionId, {
          action: "pause",
        })
      ).rejects.toThrow(/Cannot pause session: current status is 'paused'/);
    });

    it("resumes a paused session: paused -> active, logs SESSION_RESUMED", async () => {
      const result = await transitionSession(SEED_HOSPITAL_ID, testSessionId, {
        action: "resume",
        actorRole: "doctor",
        reason: "Doctor resumed consultations",
      });

      expect(result.session.status).toBe("active");
      expect(result.eventId).toBeTruthy();
      createdEventIds.push(result.eventId);

      const events = await getOperationalEvents(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
      });
      const resumeEvent = events.find((e) => e.eventType === "session_resumed");
      expect(resumeEvent).toBeDefined();
      expect(resumeEvent?.metadata?.newStatus).toBe("active");
    });

    it("completes an active session: active -> completed, sets completedAt and logs SESSION_COMPLETED", async () => {
      const result = await transitionSession(SEED_HOSPITAL_ID, testSessionId, {
        action: "complete",
        actorRole: "doctor",
        reason: "Shift completed, all tokens served",
      });

      expect(result.session.status).toBe("completed");
      expect(result.session.completedAt).toBeTruthy();
      expect(result.eventId).toBeTruthy();
      createdEventIds.push(result.eventId);

      const events = await getOperationalEvents(SEED_HOSPITAL_ID, {
        sessionId: testSessionId,
      });
      const completeEvent = events.find((e) => e.eventType === "session_completed");
      expect(completeEvent).toBeDefined();
      expect(completeEvent?.metadata?.newStatus).toBe("completed");
    });

    it("rejects invalid transition: cannot restart a completed session", async () => {
      await expect(
        transitionSession(SEED_HOSPITAL_ID, testSessionId, {
          action: "start",
        })
      ).rejects.toThrow(/Cannot start session/);

      await expect(
        transitionSession(SEED_HOSPITAL_ID, testSessionId, {
          action: "resume",
        })
      ).rejects.toThrow(/Cannot resume session/);
    });
  });

  describe("API Route Handlers: /api/hospitals/[hospitalId]/sessions", () => {
    it("GET /api/hospitals/[hospitalId]/sessions returns list of sessions", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/sessions`
      );
      const res = await getSessionsRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });

    it("POST /api/hospitals/[hospitalId]/sessions creates a new session", async () => {
      const routeDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      if (routeDate.getDay() === 0) routeDate.setDate(routeDate.getDate() + 1);
      const routeDateStr = routeDate.toISOString().slice(0, 10);

      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/sessions`,
        {
          method: "POST",
          body: JSON.stringify({
            id: testRouteSessionId,
            departmentId: "dept-gm",
            doctorId: testDoctorId,
            roomNumber: "999",
            date: routeDateStr,
            startTime: "14:00",
            endTime: "17:00",
          }),
        }
      );

      const res = await postSessionRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(testRouteSessionId);
      expect(json.data.status).toBe("scheduled");
    });

    it("GET /api/hospitals/[hospitalId]/sessions/[sessionId] returns single session", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/sessions/${testRouteSessionId}`
      );
      const res = await getSingleSessionRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          sessionId: testRouteSessionId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(testRouteSessionId);
    });

    it("PATCH /api/hospitals/[hospitalId]/sessions/[sessionId] updates session details", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/sessions/${testRouteSessionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            roomNumber: "998",
          }),
        }
      );
      const res = await patchSessionRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          sessionId: testRouteSessionId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.roomNumber).toBe("998");
    });

    it("POST /api/hospitals/[hospitalId]/sessions/[sessionId]/transition cancels scheduled session", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/sessions/${testRouteSessionId}/transition`,
        {
          method: "POST",
          body: JSON.stringify({
            action: "cancel",
            reason: "Doctor on emergency leave",
          }),
        }
      );

      const res = await postTransitionRoute(req, {
        params: Promise.resolve({
          hospitalId: SEED_HOSPITAL_ID,
          sessionId: testRouteSessionId,
        }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe("cancelled");
      expect(json.eventId).toBeTruthy();
      createdEventIds.push(json.eventId);
    });

    it("GET /api/hospitals/[hospitalId]/events returns operational events", async () => {
      const req = new NextRequest(
        `http://localhost:3000/api/hospitals/${SEED_HOSPITAL_ID}/events?limit=10`
      );
      const res = await getEventsRoute(req, {
        params: Promise.resolve({ hospitalId: SEED_HOSPITAL_ID }),
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
