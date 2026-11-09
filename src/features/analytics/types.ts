export interface ComparisonKPI {
  metric: string;
  baselineFifo: string;
  queuexOptimized: string;
  improvement: string;
  description: string;
}

export interface DepartmentThroughput {
  departmentId: string;
  departmentName: string;
  patientsServed: number;
  activeWaiting: number;
  avgConsultationMinutes: number;
  utilizationRatePercent: number;
}

export interface DoctorPacingMetric {
  doctorId: string;
  doctorName: string;
  departmentName: string;
  completedCount: number;
  avgConsultMinutes: number;
  onSchedulePercent: number;
}

export interface HourlyInflow {
  hour: string;
  count: number;
}

export interface HospitalAnalyticsSummary {
  hospitalId: string;
  hospitalName: string;
  totalConsultationsCompleted: number;
  totalPatientsRegistered: number;
  activeQueueTotal: number;
  averageWaitTimeMinutes: number;
  noShowRatePercent: number;
  baselineComparison: ComparisonKPI[];
  departmentThroughput: DepartmentThroughput[];
  doctorPacing: DoctorPacingMetric[];
  hourlyInflow: HourlyInflow[];
  generatedAt: string;
}
