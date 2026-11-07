import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function PredictionsPage() {
  return (
    <ComingSoon
      featureTitle="Waiting Time Predictions"
      section="Intelligence"
      description="Predictive wait-time forecasting engine modeling doctor consultation velocity, arrival surges, and department pace."
      plannedCapabilities={[
        "Personalized per-patient wait time prediction countdowns",
        "Arrival surge and queue length forecasting for incoming patients",
        "Confidence scoring and explanation of contributing factors",
        "Predicted clinic completion times to prevent overtime delays",
      ]}
      roadmapStage="Planned for Feature F0.9"
    />
  );
}
