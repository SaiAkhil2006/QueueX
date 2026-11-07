import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SimulationsPage() {
  return (
    <ComingSoon
      featureTitle="Operational Simulations & Stress-Testing"
      section="Intelligence"
      description="Simulate hospital disruptions, mass emergency surges, doctor delays, and test operational resilience."
      plannedCapabilities={[
        "Simulate sudden doctor absence and automatic queue absorption",
        "Inject acute emergency patient surges into clinic queues",
        "Evaluate wait time spikes under variable arrival distributions",
        "Stress-test hospital capacity for disaster and epidemic scenarios",
      ]}
      roadmapStage="Planned for Feature F0.10"
    />
  );
}
