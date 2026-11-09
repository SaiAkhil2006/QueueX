import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { getSessionQueueState } from "@/features/queue/services/queue.server";
import { calculateQueuePredictions } from "@/features/predictions/services/predictions.server";
import type { QueueEntry, QueueEntryStatus } from "@/types/queue";
import type { OPDSession } from "@/types/scheduling";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";

export interface PatientTrackingInfo {
  tokenDisplay: string;
  tokenNumber: number;
  patientName: string;
  uhidMasked: string;
  departmentName: string;
  doctorName: string;
  roomNumber: string;
  floor: string;
  wing: string;
  status: QueueEntryStatus;
  positionInQueue: number;
  patientsAheadCount: number;
  estimatedWaitMinutes: number;
  estimatedCallTime: string;
  notifyApproach: boolean;
  isDelayed: boolean;
  delayNotice?: string;
  lastUpdated: string;
}

/**
 * Privacy-Preserving Public Patient Tracking Engine:
 * Returns strictly sanitized operational tracking status for a patient's active token.
 * Prevents any accidental leakage of peer patient records or internal notes.
 */
export async function getPatientTrackingInfo(
  hospitalId: string,
  identifier: { tokenDisplay?: string; entryId?: string }
): Promise<PatientTrackingInfo | null> {
  const db = getAdminFirestore();

  let entry: QueueEntry | null = null;

  // 1. Look up by Entry ID
  if (identifier.entryId) {
    const snap = await db.doc(paths.queueEntry(hospitalId, identifier.entryId)).get();
    if (snap.exists) {
      entry = snap.data() as QueueEntry;
    }
  }

  // 2. Look up by Token Display (e.g. "GM-001")
  if (!entry && identifier.tokenDisplay) {
    const upperToken = identifier.tokenDisplay.trim().toUpperCase();
    const snap = await db
      .collection(paths.queueEntries(hospitalId))
      .where("tokenDisplay", "==", upperToken)
      .limit(1)
      .get();

    if (!snap.empty) {
      entry = snap.docs[0].data() as QueueEntry;
    }
  }

  if (!entry) {
    return null;
  }

  // 3. Fetch Session, Doctor, and Department info
  const [sessionSnap, docSnap, deptSnap] = await Promise.all([
    db.doc(paths.session(hospitalId, entry.sessionId)).get(),
    db.doc(paths.doctor(hospitalId, entry.doctorId)).get(),
    db.doc(paths.department(hospitalId, entry.departmentId)).get(),
  ]);

  const session = sessionSnap.exists ? (sessionSnap.data() as OPDSession) : null;
  const doctor = docSnap.exists ? (docSnap.data() as Doctor) : null;
  const dept = deptSnap.exists ? (deptSnap.data() as Department) : null;

  // 4. Fetch live queue state for current position and patients ahead
  const queueState = await getSessionQueueState(hospitalId, entry.sessionId);

  let position = 0;
  let aheadCount = 0;
  if (entry.status === "waiting") {
    const idx = queueState.waitingQueue.findIndex((e) => e.id === entry!.id);
    if (idx !== -1) {
      position = idx + 1;
      aheadCount = idx;
    }
  } else if (entry.status === "called") {
    position = 1;
    aheadCount = 0;
  } else if (entry.status === "in_consultation") {
    position = 0;
    aheadCount = 0;
  }

  // 5. Calculate or fetch prediction
  let estimatedWait = entry.estimatedWaitMinutes ?? aheadCount * 12;
  let callTimeStr = "Pending";

  const predSnap = await db.doc(paths.prediction(hospitalId, `pred-${entry.id}`)).get();
  if (predSnap.exists) {
    const pData = predSnap.data();
    if (typeof pData?.targetValue === "number") {
      estimatedWait = pData.targetValue;
    }
  } else if (entry.status === "waiting" && session) {
    const freshPreds = await calculateQueuePredictions(hospitalId, session.id).catch(() => []);
    const matching = freshPreds.find((p) => p.queueEntryId === entry!.id);
    if (matching) {
      estimatedWait = matching.targetValue;
    }
  }

  if (entry.status === "in_consultation") {
    estimatedWait = 0;
    callTimeStr = "Now in Room";
  } else if (entry.status === "called") {
    estimatedWait = 0;
    callTimeStr = "Proceed to Room Now";
  } else if (estimatedWait > 0) {
    const targetCallDate = new Date(Date.now() + estimatedWait * 60000);
    callTimeStr = targetCallDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  // Turn approaching alert condition
  const notifyApproach = entry.status === "waiting" && position <= 3;
  const isDelayed = estimatedWait > 35;

  let delayNotice: string | undefined = undefined;
  if (queueState.currentlyInConsultation?.priority === "emergency") {
    delayNotice = "Doctor is attending an urgent trauma case. Normal queue is temporarily held.";
  } else if (isDelayed) {
    delayNotice = "High outpatient volume in this department. Doctor is running slightly behind schedule.";
  }

  // Mask patient identifier for privacy
  const maskedPatientName = entry.patientName
    ? entry.patientName.slice(0, 1) + "***"
    : "Patient";

  return {
    tokenDisplay: entry.tokenDisplay,
    tokenNumber: entry.tokenNumber,
    patientName: maskedPatientName,
    uhidMasked: "QX-2026-****",
    departmentName: dept?.name || entry.departmentName || "General OPD",
    doctorName: doctor?.name || entry.doctorName || "Attending Physician",
    roomNumber: session?.roomNumber || "Consultation Room",
    floor: dept?.floor || "1st Floor",
    wing: dept?.buildingWing || "Main Block",
    status: entry.status,
    positionInQueue: position,
    patientsAheadCount: aheadCount,
    estimatedWaitMinutes: estimatedWait,
    estimatedCallTime: callTimeStr,
    notifyApproach,
    isDelayed,
    delayNotice,
    lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
