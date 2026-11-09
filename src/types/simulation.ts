export type DisruptionScenario =
  | "doctor_late"
  | "emergency_surge"
  | "patient_inflow_spike"
  | "doctor_emergency_absence"
  | "prolonged_consultations";

export interface SimulationParams {
  scenario: DisruptionScenario;
  sessionId?: string;
  departmentId?: string;
  delayMinutes?: number;
  emergencySurgeCount?: number;
  inflowSpikeCount?: number;
  durationMultiplier?: number;
}

export interface SimulationTimelineItem {
  id: string;
  tokenDisplay: string;
  patientName: string;
  priority: string;
  scheduledTime: string;
  disruptedCallTime: string;
  disruptedWaitMinutes: number;
  mitigatedCallTime: string;
  mitigatedWaitMinutes: number;
  minutesSaved: number;
  status: "on_track" | "delayed" | "critical_overtime";
}

export interface SimulationMetrics {
  totalPatients: number;
  avgWaitMinutes: number;
  maxWaitMinutes: number;
  projectedEndTime: string;
  overtimeMinutes: number;
  affectedPatientsCount?: number;
  recoveryMinutes?: number;
}

export interface SimulationResult {
  scenario: DisruptionScenario;
  scenarioName: string;
  description: string;
  parameters: SimulationParams;
  baselineMetrics: SimulationMetrics;
  disruptedMetrics: SimulationMetrics;
  mitigatedMetrics: SimulationMetrics;
  mitigationActions: string[];
  timeline: SimulationTimelineItem[];
  runAt: string;
}
