import { toFirestoreTimestamp } from "@/lib/firebase/server-timestamps";
import type { Consultation, ConsultationOutcome } from "@/types/consultation";
import type { Patient } from "@/types/patient";
import type { Doctor } from "@/types/doctor";
import type { OPDSession } from "@/types/scheduling";
import { SEED_HOSPITAL_ID } from "./hospital.seed";
import {
  createKolkataDateTime,
  addSecondsToDate,
} from "./dates";

const OUTCOMES: ConsultationOutcome[] = [
  "prescribed",
  "routine_clear",
  "tests_ordered",
  "follow_up_needed",
  "referred",
  "admitted",
];

export function generateSeedConsultations(
  patients: Patient[],
  doctors: Doctor[],
  sessions: OPDSession[],
  hospitalId: string = SEED_HOSPITAL_ID,
  baseDate: Date = new Date()
): Consultation[] {
  const ts = toFirestoreTimestamp(baseDate);
  const consultations: Consultation[] = [];

  // Filter completed and active sessions where consultations have occurred (past days and today morning)
  const eligibleSessions = sessions.filter(
    (s) => s.status === "completed" || (s.status === "active" && s.completedCount > 0)
  );

  // We generate exactly 100 historical consultation records
  const TARGET_COUNT = 100;

  for (let i = 0; i < TARGET_COUNT; i++) {
    const seq = String(i + 1).padStart(3, "0");
    const id = `cns-${seq}`;

    // Select doctor & matching eligible session
    const doc = doctors[i % doctors.length];
    const docSessions = eligibleSessions.filter((s) => s.doctorId === doc.id);
    const session =
      docSessions.length > 0 ? docSessions[i % docSessions.length] : eligibleSessions[0];

    // Select patient
    const patient = patients[i % patients.length];

    // Compute realistic consultation duration around the doctor's average pace
    // Variance is deterministic based on index: ±25%
    const baseDurationMinutes = doc.consultationDurationEstimate;
    const varianceFactor = 0.8 + ((i * 7) % 45) / 100; // between 0.80 and 1.24
    const durationSeconds = Math.round(baseDurationMinutes * 60 * varianceFactor);

    // Consultation start time inside session hours (09:00 - 12:45)
    // Offset by token slot
    const tokenNumber = (i % 20) + 1;
    const minutesFromStart = Math.min(15 + tokenNumber * 10, 210);
    const startHour = 9 + Math.floor(minutesFromStart / 60);
    const startMinute = minutesFromStart % 60;
    const timeStr = `${String(startHour).padStart(2, "0")}:${String(startMinute).padStart(2, "0")}`;

    const startDate = createKolkataDateTime(session.date, timeStr);
    const completedDate = addSecondsToDate(startDate, durationSeconds);

    const startedAt = toFirestoreTimestamp(startDate);
    const completedAt = toFirestoreTimestamp(completedDate);

    const outcome = OUTCOMES[i % OUTCOMES.length];
    const delayReason =
      durationSeconds > baseDurationMinutes * 60 * 1.15
        ? "Patient presented multiple chronic comorbidities requiring thorough examination"
        : null;

    consultations.push({
      id,
      hospitalId,
      departmentId: doc.departmentId,
      departmentName: doc.departmentName,
      doctorId: doc.id,
      doctorName: doc.name,
      sessionId: session.id,
      queueEntryId: `qe-cns-${seq}`,
      patientId: patient.id,
      patientName: patient.name,
      tokenNumber,
      status: "completed" as const,
      startedAt,
      completedAt,
      durationSeconds,
      outcome,
      delayReason,
      notes: `Consultation completed with clinical outcome: ${outcome}`,
      createdAt: ts,
    });
  }

  return consultations;
}
