import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { OPDSession, OPDSessionStatus } from "@/types/scheduling";
import { SEED_HOSPITAL_ID } from "./hospital.seed";
import { SEED_DOCTORS_CONFIG } from "./doctors.seed";
import {
  getKolkataDateString,
  createKolkataTimestamp,
} from "./dates";

export function generateSeedSessions(
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): OPDSession[] {
  const ts = toFirestoreTimestamp(baseDate);
  const sessions: OPDSession[] = [];

  // Date offsets: -2 (2 days ago), -1 (yesterday), 0 (today), 1 (tomorrow), 2 (day after tomorrow)
  const dateConfigs = [
    {
      offset: -2,
      shift: "morning",
      startTime: "09:00",
      endTime: "13:00",
      status: "completed" as OPDSessionStatus,
      totalTokens: 22,
      completed: 22,
      waiting: 0,
      activeToken: 22,
      hasStarted: true,
      hasCompleted: true,
    },
    {
      offset: -1,
      shift: "morning",
      startTime: "09:00",
      endTime: "13:00",
      status: "completed" as OPDSessionStatus,
      totalTokens: 24,
      completed: 24,
      waiting: 0,
      activeToken: 24,
      hasStarted: true,
      hasCompleted: true,
    },
    {
      offset: 0,
      shift: "morning",
      startTime: "09:00",
      endTime: "13:00",
      status: "active" as OPDSessionStatus,
      totalTokens: 20,
      completed: 12,
      waiting: 8,
      activeToken: 13,
      hasStarted: true,
      hasCompleted: false,
    },
    {
      offset: 0,
      shift: "afternoon",
      startTime: "14:00",
      endTime: "17:00",
      status: "scheduled" as OPDSessionStatus,
      totalTokens: 10,
      completed: 0,
      waiting: 10,
      activeToken: null,
      hasStarted: false,
      hasCompleted: false,
    },
    {
      offset: 1,
      shift: "morning",
      startTime: "09:00",
      endTime: "13:00",
      status: "scheduled" as OPDSessionStatus,
      totalTokens: 8,
      completed: 0,
      waiting: 8,
      activeToken: null,
      hasStarted: false,
      hasCompleted: false,
    },
    {
      offset: 2,
      shift: "morning",
      startTime: "09:00",
      endTime: "13:00",
      status: "scheduled" as OPDSessionStatus,
      totalTokens: 5,
      completed: 0,
      waiting: 5,
      activeToken: null,
      hasStarted: false,
      hasCompleted: false,
    },
  ];

  for (const doc of SEED_DOCTORS_CONFIG) {
    for (const cfg of dateConfigs) {
      const dateStr = getKolkataDateString(cfg.offset, baseDate);
      const shiftTag = cfg.shift === "morning" ? "m" : "a";
      const offsetTag =
        cfg.offset < 0 ? `n${Math.abs(cfg.offset)}` : `p${cfg.offset}`;
      const sessionId = `ses-${doc.id}-${offsetTag}-${shiftTag}`;

      const startedAt = cfg.hasStarted
        ? createKolkataTimestamp(dateStr, cfg.startTime)
        : null;
      const completedAt = cfg.hasCompleted
        ? createKolkataTimestamp(dateStr, cfg.endTime)
        : null;

      sessions.push({
        id: sessionId,
        hospitalId,
        departmentId: doc.departmentId,
        departmentName: doc.departmentName,
        doctorId: doc.id,
        doctorName: doc.name,
        roomNumber: doc.roomNumber,
        date: dateStr,
        startTime: cfg.startTime,
        endTime: cfg.endTime,
        status: cfg.status,
        currentRunningToken: cfg.activeToken,
        totalTokensIssued: cfg.totalTokens,
        completedCount: cfg.completed,
        waitingCount: cfg.waiting,
        startedAt,
        completedAt,
        createdAt: ts,
        updatedAt: ts,
      });
    }
  }

  return sessions;
}
