import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function AnalyticsPage() {
  return (
    <ComingSoon
      featureTitle="OPD Operational Intelligence & Analytics"
      section="Insights"
      description="Historical consultation performance, doctor utilization, department throughput KPIs, and waiting room analytics."
      plannedCapabilities={[
        "Departmental patient throughput trends and historical averages",
        "Doctor consultation duration distributions and utilization rates",
        "Hourly arrival rate heatmaps to optimize doctor shift rostering",
        "Bottleneck incident audit log and recommendation impact analysis",
      ]}
      roadmapStage="Planned for Feature F0.10"
    />
  );
}
