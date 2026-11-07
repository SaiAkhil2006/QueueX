import React from "react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function SessionsPage() {
  return (
    <ComingSoon
      featureTitle="Clinic OPD Sessions"
      section="Queue Operations"
      description="Manage daily outpatient clinic sessions, track active doctor rooms, and monitor session-level throughput."
      plannedCapabilities={[
        "Activate and initialize daily OPD sessions across clinical departments",
        "Monitor session KPIs (running token, completed consultations, waiting queue)",
        "Pause, resume, and extend active doctor clinic hours",
        "Session sign-off and end-of-shift operational summary generation",
      ]}
      roadmapStage="Planned for Feature F0.8"
    />
  );
}
