import { describe, it, expect } from "vitest";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { paths } from "@/lib/firebase/collections";
import { SEED_HOSPITAL_ID } from "../scripts/seed/hospital.seed";
import { runDisruptionSimulation } from "@/features/simulations/services/simulations.server";

describe("Phase 6: Disruption Intelligence & Isolated Simulation Environment", () => {
  const db = getAdminFirestore();

  it("simulates doctor late arrival scenario and projects queue recovery", async () => {
    const result = await runDisruptionSimulation(SEED_HOSPITAL_ID, {
      scenario: "doctor_late",
      delayMinutes: 40,
    });

    expect(result.scenario).toBe("doctor_late");
    expect(result.disruptedMetrics.overtimeMinutes).toBeGreaterThanOrEqual(30);
    expect(result.mitigatedMetrics.recoveryMinutes).toBeGreaterThan(0);
    expect(result.mitigatedMetrics.avgWaitMinutes).toBeLessThan(
      result.disruptedMetrics.avgWaitMinutes
    );
    expect(result.timeline.length).toBeGreaterThan(0);
    expect(result.mitigationActions.length).toBeGreaterThan(0);
  });

  it("simulates acute emergency surge scenario with priority dispatch", async () => {
    const surgeCount = 3;
    const result = await runDisruptionSimulation(SEED_HOSPITAL_ID, {
      scenario: "emergency_surge",
      emergencySurgeCount: surgeCount,
    });

    expect(result.scenario).toBe("emergency_surge");
    expect(result.timeline.some((t) => t.priority === "emergency")).toBe(true);
    // Emergency patients are ordered first
    expect(result.timeline[0].priority).toBe("emergency");
    expect(result.mitigatedMetrics.recoveryMinutes).toBeGreaterThan(0);
  });

  it("simulates walk-in influx spike and parallel room capacity offloading", async () => {
    const result = await runDisruptionSimulation(SEED_HOSPITAL_ID, {
      scenario: "patient_inflow_spike",
      inflowSpikeCount: 8,
    });

    expect(result.scenario).toBe("patient_inflow_spike");
    expect(result.disruptedMetrics.totalPatients).toBeGreaterThanOrEqual(8);
    expect(result.mitigatedMetrics.avgWaitMinutes).toBeLessThan(
      result.disruptedMetrics.avgWaitMinutes
    );
  });

  it("guarantees complete isolation without mutating live Firestore state", async () => {
    // Record baseline count of predictions and queue entries
    const [entriesBefore, recsBefore] = await Promise.all([
      db.collection(paths.queueEntries(SEED_HOSPITAL_ID)).get(),
      db.collection(paths.recommendations(SEED_HOSPITAL_ID)).get(),
    ]);

    // Run multiple disruption simulations
    await runDisruptionSimulation(SEED_HOSPITAL_ID, {
      scenario: "prolonged_consultations",
      durationMultiplier: 2.5,
    });
    await runDisruptionSimulation(SEED_HOSPITAL_ID, {
      scenario: "doctor_emergency_absence",
    });

    // Verify Firestore state was NOT mutated
    const [entriesAfter, recsAfter] = await Promise.all([
      db.collection(paths.queueEntries(SEED_HOSPITAL_ID)).get(),
      db.collection(paths.recommendations(SEED_HOSPITAL_ID)).get(),
    ]);

    expect(entriesAfter.size).toBe(entriesBefore.size);
    expect(recsAfter.size).toBe(recsBefore.size);
  });
});
