import "server-only";

import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { getSessionQueueState } from "@/features/queue/services/queue.server";
import type {
  SimulationParams,
  SimulationResult,
  SimulationTimelineItem,
  SimulationMetrics,
} from "@/types/simulation";
import type { OPDSession } from "@/types/scheduling";
import type { Doctor } from "@/types/doctor";
import type { Department } from "@/types/department";

interface SyntheticPatient {
  id: string;
  tokenDisplay: string;
  patientName: string;
  priority: "normal" | "priority" | "emergency";
  baselineDurationMinutes: number;
}

/**
 * Isolated Disruption Simulation Engine:
 * Generates mathematical projections of operational disruptions and assesses
 * QueueX's mitigation efficiency purely in-memory WITHOUT mutating live Firestore state.
 */
export async function runDisruptionSimulation(
  hospitalId: string,
  params: SimulationParams
): Promise<SimulationResult> {
  const db = getAdminFirestore();

  // 1. Fetch Session and Department Context for baseline modeling
  let targetSession: OPDSession | null = null;
  let doctorName = "Attending Physician";
  let deptName = "General Medicine";

  if (params.sessionId) {
    const sSnap = await db.doc(paths.session(hospitalId, params.sessionId)).get();
    if (sSnap.exists) {
      targetSession = sSnap.data() as OPDSession;
      const dSnap = await db.doc(paths.doctor(hospitalId, targetSession.doctorId)).get();
      if (dSnap.exists) doctorName = (dSnap.data() as Doctor).name;
      const deptSnap = await db.doc(paths.department(hospitalId, targetSession.departmentId)).get();
      if (deptSnap.exists) deptName = (deptSnap.data() as Department).name;
    }
  }

  // 2. Extract or Synthesize Patient Queue
  let patients: SyntheticPatient[] = [];

  if (params.sessionId) {
    const state = await getSessionQueueState(hospitalId, params.sessionId).catch(() => null);
    if (state && state.waitingQueue.length > 0) {
      patients = state.waitingQueue.map((e) => ({
        id: e.id,
        tokenDisplay: e.tokenDisplay,
        patientName: e.patientName,
        priority: e.priority as "normal" | "priority" | "emergency",
        baselineDurationMinutes: 12,
      }));
    }
  }

  // Fallback to realistic synthetic cohort if queue is small or empty
  if (patients.length < 5) {
    const defaultCohort: SyntheticPatient[] = [
      { id: "p1", tokenDisplay: "GM-001", patientName: "A. Sharma", priority: "normal", baselineDurationMinutes: 12 },
      { id: "p2", tokenDisplay: "GM-002", patientName: "V. Rao", priority: "normal", baselineDurationMinutes: 10 },
      { id: "p3", tokenDisplay: "GM-003", patientName: "S. Devi", priority: "priority", baselineDurationMinutes: 15 },
      { id: "p4", tokenDisplay: "GM-004", patientName: "K. Reddy", priority: "normal", baselineDurationMinutes: 12 },
      { id: "p5", tokenDisplay: "GM-005", patientName: "M. Kumar", priority: "normal", baselineDurationMinutes: 14 },
      { id: "p6", tokenDisplay: "GM-006", patientName: "P. Patnaik", priority: "normal", baselineDurationMinutes: 11 },
      { id: "p7", tokenDisplay: "GM-007", patientName: "R. Verma", priority: "normal", baselineDurationMinutes: 13 },
      { id: "p8", tokenDisplay: "GM-008", patientName: "L. Naidu", priority: "priority", baselineDurationMinutes: 15 },
    ];
    patients = [...patients, ...defaultCohort.slice(patients.length)];
  }

  // 3. Scenario-Specific Transformation & Disruption Modeling
  const scenario = params.scenario;
  let scenarioName = "Disruption Scenario";
  let description = "";
  const mitigationActions: string[] = [];

  const baseStartTime = new Date();
  baseStartTime.setMinutes(0, 0, 0); // Round hour

  // Compute Baseline Metrics
  let baseRunningMinutes = 0;
  const baselineWaitTimes: number[] = [];
  for (let i = 0; i < patients.length; i++) {
    baselineWaitTimes.push(baseRunningMinutes);
    baseRunningMinutes += patients[i].baselineDurationMinutes;
  }
  const baseAvgWait = Math.round(baselineWaitTimes.reduce((a, b) => a + b, 0) / patients.length);
  const baseMaxWait = baselineWaitTimes[baselineWaitTimes.length - 1];
  const baseEndTime = new Date(baseStartTime.getTime() + baseRunningMinutes * 60000);

  const baselineMetrics: SimulationMetrics = {
    totalPatients: patients.length,
    avgWaitMinutes: baseAvgWait,
    maxWaitMinutes: baseMaxWait,
    projectedEndTime: baseEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    overtimeMinutes: 0,
  };

  // Disrupted vs Mitigated Calculations
  let disruptedWaitTimes: number[] = [];
  let mitigatedWaitTimes: number[] = [];
  let simulatedPatients: SyntheticPatient[] = [...patients];

  switch (scenario) {
    case "doctor_late": {
      const delay = params.delayMinutes ?? 35;
      scenarioName = `Physician Late Arrival (+${delay} min)`;
      description = `Dr. ${doctorName} is held up in morning clinical rounds and arrives ${delay} minutes late to Room 101.`;
      mitigationActions.push(
        "Nurse practitioner starts digital vitals intake 20 minutes prior to arrival.",
        "QueueX auto-flags delay to patients via SMS/tracker to prevent waiting room crowding.",
        "Peer physician absorbs 2 routine walk-ins at the tail of the session."
      );

      // Disrupted: entire schedule shifted back by delay
      disruptedWaitTimes = baselineWaitTimes.map((w) => w + delay);

      // Mitigated: triage intake saves 3m per patient; peer room offloads 25% of load
      const mitigatedDelay = Math.max(8, Math.round(delay * 0.35));
      mitigatedWaitTimes = baselineWaitTimes.map((w) =>
        Math.max(w, Math.round(w * 0.75 + mitigatedDelay))
      );
      break;
    }

    case "emergency_surge": {
      const surgeCount = params.emergencySurgeCount ?? 3;
      scenarioName = `Acute Emergency Surge (+${surgeCount} Trauma Cases)`;
      description = `Trauma unit routes ${surgeCount} high-priority emergency patients directly into the General OPD session.`;
      mitigationActions.push(
        "Emergency triage tokens jump to position #1 with automated priority dispatch.",
        "QueueX notifies non-critical patients of temporary emergency pause.",
        "Two stable consultations dynamically redirected to adjacent available consultation room."
      );

      // Insert emergency cases at the front
      const emergencyPatients: SyntheticPatient[] = Array.from({ length: surgeCount }, (_, i) => ({
        id: `emg-${i}`,
        tokenDisplay: `EMG-0${i + 1}`,
        patientName: `Emergency Trauma Case #${i + 1}`,
        priority: "emergency",
        baselineDurationMinutes: 18,
      }));

      simulatedPatients = [...emergencyPatients, ...patients];

      // Disrupted: all normal patients wait behind the emergencies
      let running = 0;
      disruptedWaitTimes = simulatedPatients.map((p) => {
        const wait = running;
        running += p.baselineDurationMinutes;
        return wait;
      });

      // Mitigated: emergency cases handled, 2 routine cases transferred to Room 102
      let mitRunning = 0;
      mitigatedWaitTimes = simulatedPatients.map((p, idx) => {
        if (p.priority === "emergency") {
          const wait = mitRunning;
          mitRunning += p.baselineDurationMinutes;
          return wait;
        }
        // Non-emergencies benefit from parallel room transfer
        const mitigatedWait = Math.max(10, Math.round(disruptedWaitTimes[idx] * 0.55));
        return mitigatedWait;
      });
      break;
    }

    case "patient_inflow_spike": {
      const spikeCount = params.inflowSpikeCount ?? 10;
      scenarioName = `Peak Walk-In Surge (+${spikeCount} Patients)`;
      description = `Sudden outpatient influx of ${spikeCount} walk-in patients during peak registration hours in ${deptName}.`;
      mitigationActions.push(
        "Automated walk-in throttling & staggered token return times.",
        "Secondary backup consultation room opened with on-call physician.",
        "Fast-track counter activated for routine prescription renewals."
      );

      const spikePatients: SyntheticPatient[] = Array.from({ length: spikeCount }, (_, i) => ({
        id: `spk-${i}`,
        tokenDisplay: `GM-W${i + 1}`,
        patientName: `Walk-in Patient #${i + 1}`,
        priority: "normal",
        baselineDurationMinutes: 12,
      }));

      simulatedPatients = [...patients, ...spikePatients];

      let running = 0;
      disruptedWaitTimes = simulatedPatients.map((p) => {
        const wait = running;
        running += p.baselineDurationMinutes;
        return wait;
      });

      // Mitigated: secondary room splits 50% of the inflow
      let mitRunning = 0;
      mitigatedWaitTimes = simulatedPatients.map(() => {
        const wait = Math.round(mitRunning);
        mitRunning += 7; // Effective rate across 2 parallel rooms
        return wait;
      });
      break;
    }

    case "prolonged_consultations": {
      const mult = params.durationMultiplier ?? 2.0;
      scenarioName = `Prolonged Complex Consultations (${mult}x Duration)`;
      description = `Patients presenting with multi-system symptoms require extended diagnostic evaluation averaging ${Math.round(12 * mult)} min/consult.`;
      mitigationActions.push(
        "Split complex diagnostics: routine testing ordered in triage lab before physician re-examination.",
        "Dynamic ETA recalculation updates waiting patients with realistic expectations.",
        "Late walk-ins rescheduled to afternoon session with confirmed priority."
      );

      let running = 0;
      disruptedWaitTimes = simulatedPatients.map((p) => {
        const wait = running;
        running += Math.round(p.baselineDurationMinutes * mult);
        return wait;
      });

      let mitRunning = 0;
      mitigatedWaitTimes = simulatedPatients.map((p) => {
        const wait = mitRunning;
        mitRunning += Math.round(p.baselineDurationMinutes * (1 + (mult - 1) * 0.4));
        return wait;
      });
      break;
    }

    case "doctor_emergency_absence": {
      scenarioName = "Physician Sudden Emergency OT Absence";
      description = `Dr. ${doctorName} is summoned immediately to Emergency Surgery. Active OPD room must be suspended.`;
      mitigationActions.push(
        "Immediate automated SMS notification to queued patients.",
        "QueueX redistributes top 5 priority patients to peer rooms in the same wing.",
        "Remaining stable appointments offered digital reschedule tokens for the afternoon session."
      );

      // Disrupted: infinite wait / cancellation for all
      disruptedWaitTimes = simulatedPatients.map((_, i) => (i + 1) * 35);
      // Mitigated: redistributed across peer doctors
      mitigatedWaitTimes = simulatedPatients.map((_, i) => Math.min(60, (i + 1) * 14));
      break;
    }
  }

  // Calculate Metrics
  const disAvgWait = Math.round(
    disruptedWaitTimes.reduce((a, b) => a + b, 0) / disruptedWaitTimes.length
  );
  const disMaxWait = Math.max(...disruptedWaitTimes);
  const disTotalTime = disruptedWaitTimes[disruptedWaitTimes.length - 1] + 12;
  const disEndTime = new Date(baseStartTime.getTime() + disTotalTime * 60000);
  const disOvertime = Math.max(0, disTotalTime - baseRunningMinutes);

  const mitAvgWait = Math.round(
    mitigatedWaitTimes.reduce((a, b) => a + b, 0) / mitigatedWaitTimes.length
  );
  const mitMaxWait = Math.max(...mitigatedWaitTimes);
  const mitTotalTime = mitigatedWaitTimes[mitigatedWaitTimes.length - 1] + 12;
  const mitEndTime = new Date(baseStartTime.getTime() + mitTotalTime * 60000);
  const mitOvertime = Math.max(0, mitTotalTime - baseRunningMinutes);
  const recoveryMinutes = Math.max(0, disTotalTime - mitTotalTime);

  const affectedPatientsCount = disruptedWaitTimes.filter(
    (w, idx) => w - (baselineWaitTimes[idx] ?? 0) >= 15
  ).length;

  const disruptedMetrics: SimulationMetrics = {
    totalPatients: simulatedPatients.length,
    avgWaitMinutes: disAvgWait,
    maxWaitMinutes: disMaxWait,
    projectedEndTime: disEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    overtimeMinutes: disOvertime,
    affectedPatientsCount,
  };

  const mitigatedMetrics: SimulationMetrics = {
    totalPatients: simulatedPatients.length,
    avgWaitMinutes: mitAvgWait,
    maxWaitMinutes: mitMaxWait,
    projectedEndTime: mitEndTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    overtimeMinutes: mitOvertime,
    recoveryMinutes,
  };

  // Build Timeline
  const timeline: SimulationTimelineItem[] = simulatedPatients.map((p, idx) => {
    const disWait = disruptedWaitTimes[idx];
    const mitWait = mitigatedWaitTimes[idx];
    const saved = Math.max(0, disWait - mitWait);

    const sched = new Date(baseStartTime.getTime() + (baselineWaitTimes[idx] ?? idx * 12) * 60000);
    const disCall = new Date(baseStartTime.getTime() + disWait * 60000);
    const mitCall = new Date(baseStartTime.getTime() + mitWait * 60000);

    let status: "on_track" | "delayed" | "critical_overtime" = "on_track";
    if (disWait >= 45) status = "critical_overtime";
    else if (disWait >= 25) status = "delayed";

    return {
      id: p.id,
      tokenDisplay: p.tokenDisplay,
      patientName: p.patientName,
      priority: p.priority,
      scheduledTime: sched.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      disruptedCallTime: disCall.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      disruptedWaitMinutes: disWait,
      mitigatedCallTime: mitCall.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      mitigatedWaitMinutes: mitWait,
      minutesSaved: saved,
      status,
    };
  });

  return {
    scenario,
    scenarioName,
    description,
    parameters: params,
    baselineMetrics,
    disruptedMetrics,
    mitigatedMetrics,
    mitigationActions,
    timeline,
    runAt: new Date().toISOString(),
  };
}
