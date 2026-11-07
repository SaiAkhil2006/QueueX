/**
 * Centralized Firestore collection and document path helpers for QueueX.
 *
 * All operational data in QueueX is scoped to a hospital tenant:
 * /hospitals/{hospitalId}/{collectionName}/{documentId}
 */

export const COLLECTIONS = {
  HOSPITALS: "hospitals",
  DEPARTMENTS: "departments",
  DOCTORS: "doctors",
  SCHEDULES: "schedules",
  SESSIONS: "sessions",
  PATIENTS: "patients",
  APPOINTMENTS: "appointments",
  QUEUE_ENTRIES: "queueEntries",
  CONSULTATIONS: "consultations",
  OPERATIONAL_EVENTS: "operationalEvents",
  PREDICTIONS: "predictions",
  RECOMMENDATIONS: "recommendations",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

/**
 * Path builder helpers for collections and documents.
 */
export const paths = {
  // Top-level Hospitals
  hospitals: () => COLLECTIONS.HOSPITALS,
  hospital: (hospitalId: string) => `${COLLECTIONS.HOSPITALS}/${hospitalId}`,

  // Hospital-scoped subcollections
  departments: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.DEPARTMENTS}`,
  department: (hospitalId: string, departmentId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.DEPARTMENTS}/${departmentId}`,

  doctors: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.DOCTORS}`,
  doctor: (hospitalId: string, doctorId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.DOCTORS}/${doctorId}`,

  schedules: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.SCHEDULES}`,
  schedule: (hospitalId: string, scheduleId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.SCHEDULES}/${scheduleId}`,

  sessions: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.SESSIONS}`,
  session: (hospitalId: string, sessionId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.SESSIONS}/${sessionId}`,

  patients: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.PATIENTS}`,
  patient: (hospitalId: string, patientId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.PATIENTS}/${patientId}`,

  appointments: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.APPOINTMENTS}`,
  appointment: (hospitalId: string, appointmentId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.APPOINTMENTS}/${appointmentId}`,

  queueEntries: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.QUEUE_ENTRIES}`,
  queueEntry: (hospitalId: string, queueEntryId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.QUEUE_ENTRIES}/${queueEntryId}`,

  consultations: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.CONSULTATIONS}`,
  consultation: (hospitalId: string, consultationId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.CONSULTATIONS}/${consultationId}`,

  operationalEvents: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.OPERATIONAL_EVENTS}`,
  operationalEvent: (hospitalId: string, eventId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.OPERATIONAL_EVENTS}/${eventId}`,

  predictions: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.PREDICTIONS}`,
  prediction: (hospitalId: string, predictionId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.PREDICTIONS}/${predictionId}`,

  recommendations: (hospitalId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.RECOMMENDATIONS}`,
  recommendation: (hospitalId: string, recommendationId: string) =>
    `${COLLECTIONS.HOSPITALS}/${hospitalId}/${COLLECTIONS.RECOMMENDATIONS}/${recommendationId}`,
};
