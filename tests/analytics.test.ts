import { describe, it, expect } from "vitest";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { getHospitalAnalyticsSummary } from "@/features/analytics/services/analytics.server";

describe("Phase 8: OPD Operational Intelligence & Analytics", () => {
  it("aggregates hospital operational metrics across all subcollections", async () => {
    const summary = await getHospitalAnalyticsSummary(SEED_HOSPITAL_ID);

    expect(summary.hospitalId).toBe(SEED_HOSPITAL_ID);
    expect(summary.hospitalName).toBeDefined();
    expect(summary.totalConsultationsCompleted).toBeGreaterThanOrEqual(0);
    expect(summary.totalPatientsRegistered).toBeGreaterThanOrEqual(0);
    expect(summary.averageWaitTimeMinutes).toBeGreaterThan(0);
    expect(summary.noShowRatePercent).toBeGreaterThanOrEqual(0);
  });

  it("produces valid Baseline vs QueueX comparative efficiency benchmarks", async () => {
    const summary = await getHospitalAnalyticsSummary(SEED_HOSPITAL_ID);

    expect(summary.baselineComparison.length).toBeGreaterThanOrEqual(4);
    const waitKpi = summary.baselineComparison.find((k) =>
      k.metric.includes("Average Patient Wait Time")
    );
    expect(waitKpi).toBeDefined();
    expect(waitKpi?.improvement).toContain("Reduction");
  });

  it("computes departmental throughput and doctor pacing distributions", async () => {
    const summary = await getHospitalAnalyticsSummary(SEED_HOSPITAL_ID);

    expect(summary.departmentThroughput.length).toBeGreaterThan(0);
    expect(summary.departmentThroughput[0].departmentName).toBeDefined();

    expect(summary.doctorPacing.length).toBeGreaterThan(0);
    expect(summary.doctorPacing[0].doctorName).toBeDefined();

    expect(summary.hourlyInflow.length).toBe(10);
  });
});
